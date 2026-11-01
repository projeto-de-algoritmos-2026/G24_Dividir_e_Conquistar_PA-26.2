from math import cos, radians

REFERENCE_LATITUDE = -17.0
REFERENCE_LONGITUDE = -48.0
KM_PER_DEGREE_LATITUDE = 111.195
KM_PER_DEGREE_LONGITUDE = KM_PER_DEGREE_LATITUDE * cos(radians(REFERENCE_LATITUDE))

AIRPORTS = {
    "SBBR": (-15.8697, -47.9208, "Brasília"),
    "SBGR": (-23.4356, -46.4731, "São Paulo"),
    "SBGL": (-22.8090, -43.2506, "Rio de Janeiro"),
    "SBCF": (-19.6244, -43.9719, "Belo Horizonte"),
    "SBGO": (-16.6320, -49.2207, "Goiânia"),
    "SBSV": (-12.9086, -38.3225, "Salvador"),
    "SBRF": (-8.1265, -34.9236, "Recife"),
    "SBCT": (-25.5285, -49.1758, "Curitiba"),
    "SBCG": (-20.4694, -54.6703, "Campo Grande"),
    "SBKP": (-23.0074, -47.1345, "Campinas"),
    "SBSP": (-23.6261, -46.6566, "Congonhas"),
    "SBFL": (-27.6703, -48.5525, "Florianópolis"),
    "SBEG": (-3.0386, -60.0497, "Manaus"),
    "SBBE": (-1.3793, -48.4763, "Belém"),
    "SBFZ": (-3.7763, -38.5326, "Fortaleza"),
    "SBPA": (-29.9939, -51.1711, "Porto Alegre"),
    "SBSL": (-2.5854, -44.2341, "São Luís"),
    "SBTE": (-5.0599, -42.8235, "Teresina"),
    "SBPV": (-8.7093, -63.9023, "Porto Velho"),
    "SBRB": (-9.8689, -67.8981, "Rio Branco"),
    "SBCY": (-15.6529, -56.1167, "Cuiabá"),
    "SBCZ": (-7.5999, -72.7695, "Cruzeiro do Sul"),
    "SBJP": (-7.1458, -34.9486, "João Pessoa"),
    "SBMO": (-9.5108, -35.7917, "Maceió"),
    "SBAR": (-10.9840, -37.0703, "Aracaju"),
    "SBNF": (-26.8794, -48.6514, "Navegantes"),
}


def to_plane(latitude, longitude):
    return (
        (longitude - REFERENCE_LONGITUDE) * KM_PER_DEGREE_LONGITUDE,
        (latitude - REFERENCE_LATITUDE) * KM_PER_DEGREE_LATITUDE,
    )


def to_geographic(x, y):
    return (
        REFERENCE_LATITUDE + y / KM_PER_DEGREE_LATITUDE,
        REFERENCE_LONGITUDE + x / KM_PER_DEGREE_LONGITUDE,
    )


def airport_position(code):
    latitude, longitude, _ = AIRPORTS[code]
    return to_plane(latitude, longitude)


def airport_name(code):
    return AIRPORTS[code][2]
