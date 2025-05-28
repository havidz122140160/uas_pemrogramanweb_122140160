from wsgiref.simple_server import make_server
from pyramid.config import Configurator
from pyramid.response import Response
from pyramid.view import view_config
import json


@view_config(route_name='tracks', request_method='GET')
def get_tracks(request):
    data = {
        "data": [
            {"id": 1, "title": "Lagu Bebas 1", "artist": "Musisi A"},
            {"id": 2, "title": "Lagu Bebas 2", "artist": "Musisi B"}
        ]
    }

    response = Response(
        body=json.dumps(data),
        content_type='application/json'
    )
    # CORS headers
    response.headers.update({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })

    return response


@view_config(route_name='tracks', request_method='OPTIONS')
def tracks_options(request):
    return Response(
        status=204,
        headers={
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    )


if __name__ == '__main__':
    with Configurator() as config:
        config.add_route('tracks', '/tracks')
        config.scan()
        app = config.make_wsgi_app()

    server = make_server('0.0.0.0', 6543, app)
    print("✅ Pyramid backend running at http://localhost:6543")
    server.serve_forever()
