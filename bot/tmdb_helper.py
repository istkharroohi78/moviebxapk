import os
import aiohttp

TMDB_API_KEY = os.environ.get('TMDB_API_KEY', '')
TMDB_BASE = 'https://api.themoviedb.org/3'
TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'


def _list_to_str(lst):
    if lst:
        return ", ".join(str(x) for x in lst if x)
    return ""


async def tmdb_search(title, year=None):
    if not TMDB_API_KEY:
        return []
    params = {'api_key': TMDB_API_KEY, 'query': title}
    if year:
        params['year'] = str(year)
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f'{TMDB_BASE}/search/multi', params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get('results', [])
    except Exception as e:
        print(f"[TMDB] Search error: {e}")
    return []


async def tmdb_get_details(tmdb_id, media_type='movie'):
    if not TMDB_API_KEY:
        return None
    try:
        async with aiohttp.ClientSession() as session:
            url = f'{TMDB_BASE}/{media_type}/{tmdb_id}'
            params = {
                'api_key': TMDB_API_KEY,
                'append_to_response': 'credits,external_ids'
            }
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    return await resp.json()
    except Exception as e:
        print(f"[TMDB] Details error: {e}")
    return None


async def get_movie_info(query, year=None, tmdb_id=None, media_type=None):
    """
    Fetch movie/TV metadata from TMDB.
    Returns a dict compatible with the old Cinemagoer-based structure.
    """
    if tmdb_id and media_type:
        mid = tmdb_id
        mtype = media_type
    else:
        results = await tmdb_search(query, year)
        if not results:
            return None
        valid = [r for r in results if r.get('media_type') in ('movie', 'tv')]
        if not valid:
            valid = results
        if year:
            yr_match = [r for r in valid if str(
                (r.get('release_date') or r.get('first_air_date', ''))[:4]
            ) == str(year)]
            if yr_match:
                valid = yr_match
        best = valid[0]
        mid = best.get('id')
        mtype = best.get('media_type', 'movie')

    details = await tmdb_get_details(mid, mtype)
    if not details:
        return None

    credits = details.get('credits', {})
    cast = [c['name'] for c in credits.get('cast', [])[:10]]
    crew = credits.get('crew', [])
    directors   = [c['name'] for c in crew if c.get('job') == 'Director']
    writers     = [c['name'] for c in crew if c.get('department') == 'Writing']
    producers   = [c['name'] for c in crew if c.get('job') == 'Producer']
    composers   = [c['name'] for c in crew if 'Composer' in c.get('job', '')]

    title    = details.get('title') or details.get('name', '')
    release  = details.get('release_date') or details.get('first_air_date', '')
    year_val = release[:4] if release else None
    genres   = [g['name'] for g in details.get('genres', [])]

    poster_path   = details.get('poster_path')
    poster_url    = f'{TMDB_IMAGE_BASE}{poster_path}' if poster_path else None
    backdrop_path = details.get('backdrop_path')  # /xxx.jpg raw path

    runtime_val = details.get('runtime') or (
        details.get('episode_run_time', [None])[0]
        if details.get('episode_run_time') else None
    )
    langs     = [l.get('english_name', '') for l in details.get('spoken_languages', [])]
    countries = [c.get('name', '') for c in details.get('production_countries', [])]

    ext_ids = details.get('external_ids', {})
    imdb_id = ext_ids.get('imdb_id', '')
    seasons = details.get('number_of_seasons')
    kind    = 'tv series' if mtype == 'tv' else 'movie'

    plot = details.get('overview', '')
    if plot and len(plot) > 800:
        plot = plot[:800] + '...'

    rating = str(details.get('vote_average', ''))
    votes  = details.get('vote_count')
    url    = (
        f'https://www.imdb.com/title/{imdb_id}'
        if imdb_id
        else f'https://www.themoviedb.org/{mtype}/{mid}'
    )

    return {
        'title':          title,
        'votes':          votes,
        'aka':            '',
        'seasons':        seasons,
        'box_office':     None,
        'localized_title': title,
        'kind':           kind,
        'imdb_id':        imdb_id or '',
        'cast':           _list_to_str(cast),
        'runtime':        str(runtime_val) if runtime_val else '',
        'countries':      _list_to_str(countries),
        'certificates':   '',
        'languages':      _list_to_str(langs),
        'director':       _list_to_str(directors),
        'writer':         _list_to_str(writers),
        'producer':       _list_to_str(producers),
        'composer':       _list_to_str(composers),
        'cinematographer': '',
        'music_team':     '',
        'distributors':   '',
        'release_date':   release or year_val or 'N/A',
        'year':           int(year_val) if year_val and year_val.isdigit() else None,
        'genres':         _list_to_str(genres),
        'poster_url':     poster_url,
        'poster':         poster_url,
        'poster_path':    poster_path or '',
        'backdrop_path':  backdrop_path or '',
        'tmdb_id':        mid,
        'media_type':     mtype,
        'plot':           plot,
        'rating':         rating,
        'url':            url,
    }
