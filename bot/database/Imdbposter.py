import re
import aiohttp
from io import BytesIO
from PIL import Image
from info import FTMBOTZX_IMAGE_FETCH
from tmdb_helper import get_movie_info


LONG_IMDB_DESCRIPTION = False


def list_to_str(lst):
    if lst:
        return ", ".join(map(str, lst))
    return ""


async def fetch_image(url, size=(720, 720)):
    if not FTMBOTZX_IMAGE_FETCH:
        print("Image fetching is disabled.")
        return None

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.read()
                    img = Image.open(BytesIO(content))
                    img = img.resize(size, Image.LANCZOS)
                    img_byte_arr = BytesIO()
                    img.save(img_byte_arr, format='JPEG')
                    img_byte_arr.seek(0)
                    return img_byte_arr
                else:
                    print(f"Failed to fetch image: {response.status}")
    except aiohttp.ClientError as e:
        print(f"HTTP request error in fetch_image: {e}")
    except IOError as e:
        print(f"IO error in fetch_image: {e}")
    except Exception as e:
        print(f"Unexpected error in fetch_image: {e}")
    return None


async def get_movie_details(query, id=False, file=None):
    try:
        if id:
            return await get_movie_info(query=query, tmdb_id=query, media_type='movie')

        query = query.strip().lower()
        title = query
        year = re.findall(r'[1-2]\d{3}$', query, re.IGNORECASE)
        if year:
            year = year[0]
            title = query.replace(year, "").strip()
        elif file is not None:
            found = re.findall(r'[1-2]\d{3}', file, re.IGNORECASE)
            year = found[0] if found else None
        else:
            year = None

        return await get_movie_info(query=title, year=year)

    except Exception as e:
        print(f"An error occurred in get_movie_details: {e}")
        return None
