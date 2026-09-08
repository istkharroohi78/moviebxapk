
from aiohttp import web
import re
import math
import logging
import base64
import secrets
import time
import mimetypes
from struct import unpack as struct_unpack
from aiohttp.http_exceptions import BadStatusLine
from ftmbotzx_botz import multi_clients, work_loads, FtmbotzxBot
from server.exceptions import FIleNotFound, InvalidHash
from zzint import StartTime, __version__
from util.custom_dl import ByteStreamer
from util.time_format import get_readable_time
from util.render_template import render_page
from info import *
from urllib.parse import quote
from pyrogram.file_id import FileId, FileType
from motor.motor_asyncio import AsyncIOMotorClient

# Separate motor client for the stream-by-fileid endpoint
_stream_motor = AsyncIOMotorClient(DATABASE_URI)
_stream_db = _stream_motor[DATABASE_NAME]


def _decode_short_file_id(s: str) -> bytes:
    """Reverse the custom RLE+base64 encoding used by encode_file_id() in ia_filterdb."""
    padded = s + "=" * (-len(s) % 4)
    rle = base64.urlsafe_b64decode(padded)
    result = b""
    i = 0
    while i < len(rle):
        if rle[i] == 0:
            i += 1
            if i < len(rle):
                result += b"\x00" * rle[i]
        else:
            result += bytes([rle[i]])
        i += 1
    # encode_file_id appends bytes([22, 4]) as sentinel — strip them
    if len(result) >= 2 and result[-2] == 22 and result[-1] == 4:
        result = result[:-2]
    return result

routes = web.RouteTableDef()

@routes.get("/", allow_head=True)
async def root_route_handler(request):
    return web.json_response({"status": "ok", "message": "@ftmbotzx_botz"})

@routes.get(r"/watch/{path:\S+}", allow_head=True)
async def watch_handler(request: web.Request):
    try:
        path = request.match_info["path"]
        match = re.search(r"^([a-zA-Z0-9_-]{6})(\d+)$", path)
        if match:
            secure_hash = match.group(1)
            id = int(match.group(2))
        else:
            id = int(re.search(r"(\d+)(?:\/\S+)?", path).group(1))
            secure_hash = request.rel_url.query.get("hash")
        return web.Response(text=await render_page(id, secure_hash), content_type='text/html')
    except InvalidHash as e:
        raise web.HTTPForbidden(text=e.message)
    except FIleNotFound as e:
        raise web.HTTPNotFound(text=e.message)
    except (AttributeError, BadStatusLine, ConnectionResetError):
        return web.Response(status=500, text="Connection error")
    except Exception as e:
        logging.critical(e.with_traceback(None))
        raise web.HTTPInternalServerError(text=str(e))

@routes.get(r"/stream/{chat_id:\-?\d+}/{path:\S+}", allow_head=True)
async def channel_stream_handler(request: web.Request):
    """Stream a file from any indexed channel using chat_id + message_id."""
    try:
        chat_id = int(request.match_info["chat_id"])
        path = request.match_info["path"]
        match = re.search(r"^([a-zA-Z0-9_-]{6})(\d+)$", path)
        if match:
            secure_hash = match.group(1)
            id = int(match.group(2))
        else:
            id = int(re.search(r"(\d+)(?:\/\S+)?", path).group(1))
            secure_hash = request.rel_url.query.get("hash")
        return await media_streamer(request, id, secure_hash, chat_id=chat_id)
    except InvalidHash as e:
        raise web.HTTPForbidden(text=e.message)
    except FIleNotFound as e:
        raise web.HTTPNotFound(text=e.message)
    except (AttributeError, BadStatusLine, ConnectionResetError):
        return web.Response(status=500, text="Connection error")
    except Exception as e:
        logging.critical(e.with_traceback(None))
        raise web.HTTPInternalServerError(text=str(e))

@routes.get(r"/{path:\S+}", allow_head=True)
async def stream_handler(request: web.Request):
    try:
        path = request.match_info["path"]
        match = re.search(r"^([a-zA-Z0-9_-]{6})(\d+)$", path)
        if match:
            secure_hash = match.group(1)
            id = int(match.group(2))
        else:
            id = int(re.search(r"(\d+)(?:\/\S+)?", path).group(1))
            secure_hash = request.rel_url.query.get("hash")
        return await media_streamer(request, id, secure_hash)
    except InvalidHash as e:
        raise web.HTTPForbidden(text=e.message)
    except FIleNotFound as e:
        raise web.HTTPNotFound(text=e.message)
    except (AttributeError, BadStatusLine, ConnectionResetError):
        return web.Response(status=500, text="Connection error")
    except Exception as e:
        logging.critical(e.with_traceback(None))
        raise web.HTTPInternalServerError(text=str(e))

class_cache = {}

async def media_streamer(request: web.Request, id: int, secure_hash: str, chat_id: int = None):
    range_header = request.headers.get("Range", 0)

    index = min(work_loads, key=work_loads.get)
    faster_client = multi_clients[index]

    if MULTI_CLIENT:
        logging.info(f"Client {index} is now serving {request.remote}")

    if faster_client in class_cache:
        tg_connect = class_cache[faster_client]
        logging.debug(f"Using cached ByteStreamer object for client {index}")
    else:
        logging.debug(f"Creating new ByteStreamer object for client {index}")
        tg_connect = ByteStreamer(faster_client)
        class_cache[faster_client] = tg_connect
    logging.debug("before calling get_file_properties")
    file_id = await tg_connect.get_file_properties(id, chat_id=chat_id)
    logging.debug("after calling get_file_properties")

    if file_id.unique_id[:6] != secure_hash:
        logging.debug(f"Invalid hash for message with ID {id}")
        raise InvalidHash

    file_size = file_id.file_size

    if range_header:
        from_bytes, until_bytes = range_header.replace("bytes=", "").split("-")
        from_bytes = int(from_bytes)
        until_bytes = int(until_bytes) if until_bytes else file_size - 1
    else:
        from_bytes = request.http_range.start or 0
        until_bytes = (request.http_range.stop or file_size) - 1

    if (until_bytes > file_size) or (from_bytes < 0) or (until_bytes < from_bytes):
        return web.Response(
            status=416,
            body="416: Range not satisfiable",
            headers={"Content-Range": f"bytes */{file_size}"},
        )

    chunk_size = 1024 * 1024
    until_bytes = min(until_bytes, file_size - 1)

    offset = from_bytes - (from_bytes % chunk_size)
    first_part_cut = from_bytes - offset
    last_part_cut = until_bytes % chunk_size + 1

    req_length = until_bytes - from_bytes + 1
    part_count = math.ceil(until_bytes / chunk_size) - math.floor(offset / chunk_size)
    body = tg_connect.yield_file(
        file_id, index, offset, first_part_cut, last_part_cut, part_count, chunk_size
    )

    mime_type = file_id.mime_type
    file_name = file_id.file_name
    disposition = "attachment"

    if mime_type:
        if not file_name:
            try:
                file_name = f"{secrets.token_hex(2)}.{mime_type.split('/')[1]}"
            except (IndexError, AttributeError):
                file_name = f"{secrets.token_hex(2)}.unknown"
    else:
        if file_name:
            mime_type = mimetypes.guess_type(file_id.file_name)
        else:
            mime_type = "application/octet-stream"
            file_name = f"{secrets.token_hex(2)}.unknown"

    return web.Response(
        status=206 if range_header else 200,
        body=body,
        headers={
            "Content-Type": f"{mime_type}",
            "Content-Range": f"bytes {from_bytes}-{until_bytes}/{file_size}",
            "Content-Length": str(req_length),
            "Content-Disposition": f'{disposition}; filename="{file_name}"',
            "Accept-Ranges": "bytes",
        },
    )

@routes.get(r"/stream/fid/{file_id:.+}", allow_head=True)
async def fileid_stream_handler(request: web.Request):
    """Stream a file directly by its short file_id stored as MongoDB _id.
    This bypasses message_id lookup by reconstructing FileId from stored file_ref."""
    try:
        file_id_str = request.match_info["file_id"]

        # Look up doc in MongoDB by its _id (the short file_id)
        collection = _stream_db[COLLECTION_NAME]
        doc = await collection.find_one({"_id": file_id_str})
        if not doc:
            raise web.HTTPNotFound(text="File not found in database")

        # Decode the file_id.
        # The DB stores standard Pyrogram file_ids (e.g. BAADAgAD...) as _id.
        # Try Pyrogram's native FileId.decode() first; fall back to the custom
        # short RLE+base64 decoder for legacy docs.
        decoded_fid = None
        try:
            decoded_fid = FileId.decode(file_id_str)
            file_type_int = decoded_fid.file_type.value if hasattr(decoded_fid.file_type, "value") else int(decoded_fid.file_type)
            dc_id = decoded_fid.dc_id
            media_id = decoded_fid.media_id
            access_hash = decoded_fid.access_hash
        except Exception:
            try:
                raw = _decode_short_file_id(file_id_str)
                file_type_int, dc_id, media_id, access_hash = struct_unpack("<iiqq", raw)
            except Exception as exc:
                logging.warning(f"Cannot decode file_id '{file_id_str}': {exc}")
                raise web.HTTPBadRequest(text="Invalid file_id encoding")

        # Prefer the file_reference stored in MongoDB (may be fresher than what's
        # embedded in the file_id); fall back to the one embedded in the Pyrogram fid.
        file_ref_str = doc.get("file_ref", "") or ""
        try:
            file_reference = base64.urlsafe_b64decode(file_ref_str + "=" * (-len(file_ref_str) % 4))
            if not file_reference:
                raise ValueError("empty")
        except Exception:
            file_reference = (getattr(decoded_fid, "file_reference", None) or b"")

        # Reconstruct a FileId object using required keyword args (Pyrogram ≥ 2.x)
        fid = FileId(
            file_type=FileType(file_type_int),
            dc_id=dc_id,
            media_id=media_id,
            access_hash=access_hash,
            file_reference=file_reference,
        )
        # These extra attributes are read by ByteStreamer.yield_file and the response
        fid.file_size = int(doc.get("file_size", 0) or 0)
        fid.mime_type = doc.get("mime_type", "") or "video/mp4"
        fid.file_name = doc.get("file_name", "") or "video.mkv"
        fid.unique_id = file_id_str[:6]  # arbitrary — only used for log, not hash check

        file_size = fid.file_size
        if not file_size:
            raise web.HTTPNotFound(text="File size unknown, cannot stream")

        range_header = request.headers.get("Range", 0)
        if range_header:
            from_bytes, until_bytes = range_header.replace("bytes=", "").split("-")
            from_bytes = int(from_bytes)
            until_bytes = int(until_bytes) if until_bytes else file_size - 1
        else:
            from_bytes = request.http_range.start or 0
            until_bytes = (request.http_range.stop or file_size) - 1

        if (until_bytes > file_size) or (from_bytes < 0) or (until_bytes < from_bytes):
            return web.Response(
                status=416,
                body="416: Range not satisfiable",
                headers={"Content-Range": f"bytes */{file_size}"},
            )

        chunk_size = 1024 * 1024
        until_bytes = min(until_bytes, file_size - 1)
        offset = from_bytes - (from_bytes % chunk_size)
        first_part_cut = from_bytes - offset
        last_part_cut = until_bytes % chunk_size + 1
        req_length = until_bytes - from_bytes + 1
        part_count = math.ceil(until_bytes / chunk_size) - math.floor(offset / chunk_size)

        index = min(work_loads, key=work_loads.get)
        faster_client = multi_clients[index]
        if faster_client in class_cache:
            tg_connect = class_cache[faster_client]
        else:
            tg_connect = ByteStreamer(faster_client)
            class_cache[faster_client] = tg_connect

        body = tg_connect.yield_file(fid, index, offset, first_part_cut, last_part_cut, part_count, chunk_size)

        raw_mime = fid.mime_type or ""
        # Remap Matroska/MKV → video/webm so browsers use their EBML parser.
        # Chrome's WebM/MKV decoder is the same; serving as webm avoids container rejection.
        if "matroska" in raw_mime or raw_mime in ("video/x-matroska", "video/mkv"):
            mime_type = "video/webm"
        elif raw_mime:
            mime_type = raw_mime
        else:
            mime_type = "video/mp4"
        file_name = fid.file_name or "video.mkv"
        return web.Response(
            status=206 if range_header else 200,
            body=body,
            headers={
                "Content-Type": mime_type,
                "Content-Range": f"bytes {from_bytes}-{until_bytes}/{file_size}",
                "Content-Length": str(req_length),
                "Content-Disposition": f'inline; filename="{file_name}"',
                "Accept-Ranges": "bytes",
            },
        )
    except web.HTTPException:
        raise
    except Exception as exc:
        logging.exception(f"fileid_stream_handler error: {exc}")
        raise web.HTTPInternalServerError(text=str(exc))


async def web_server():
    app = web.Application(client_max_size=30000000)
    app.add_routes(routes)
    return app
