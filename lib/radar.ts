import qs from 'querystring'
import _fetch from 'fetch-ponyfill'
// @ts-ignore
import parse from 'parse-jsonp'
import {getRandomUserAgent} from './random-user-agent.js'

const {fetch} = _fetch()

export interface AircraftRadar {
    id: string;
    registration: string | null;
    flight: string | null;
    // ICAO ATC call signature
    callsign: string | null;
    // airport IATA code
    origin: string | null;
    // airport IATA code
    destination: string | null;
    latitude: number;
    longitude: number;
    // in feet
    altitude: number;
    // in degrees
    bearing: number;
    // in knots
    speed: number | null;
    // ft/min
    rateOfClimb: number;
    isOnGround: boolean;
    // https://en.wikipedia.org/wiki/Transponder_(aeronautics)
    squawkCode: string;
    // ICAO aircraft type designator
    model: string | null;
    // ICAO aircraft registration number
    modeSCode: string | null;
    // F24 "radar" data source ID
    radar: string;
    isGlider: boolean;
    timestamp: number | null;
}

const isObj = (o: any) => 'object' === typeof o && o !== null && !Array.isArray(o)

const endpoint = 'https://data-cloud.flightradar24.com/zones/fcgi/feed.js'

const headers = {
    'Accept': 'application/javascript',
}

export interface RadarOptions {
    // use US/Canada radar data source
    FAA: boolean,
    // use FLARM data source
    FLARM: boolean,
    // use MLAT data source
    MLAT: boolean,
    // use ADS-B data source
    ADSB: boolean,
    // fetch airborne aircraft
    inAir: boolean,
    // fetch (active) aircraft on ground
    onGround: boolean,
    // fetch inactive aircraft (on ground)
    inactive: boolean,
    // fetch gliders
    gliders: boolean,
    // if out of coverage
    estimatedPositions: boolean
}

const defaults: RadarOptions = {
    FAA: true,
    FLARM: true,
    MLAT: true,
    ADSB: true,
    inAir: true,
    onGround: false,
    inactive: false,
    gliders: false,
    estimatedPositions: false
}

const fetchFromRadar = async (north: number, west: number, south: number, east: number, when?: number, opt: Partial<RadarOptions> = {}) => {
    opt = {
        ...defaults,
        ...opt,
    }

    const query = {
        bounds: [north, south, west, east].join(','),
        callback: 'jsonp',
        // options
        faa: opt.FAA ? '1' : '0',
        flarm: opt.FLARM ? '1' : '0',
        mlat: opt.MLAT ? '1' : '0',
        adsb: opt.ADSB ? '1' : '0',
        air: opt.inAir ? '1' : '0',
        gnd: opt.onGround ? '1' : '0',
        vehicles: opt.inactive ? '1' : '0',
        gliders: opt.gliders ? '1' : '0',
        estimated: opt.estimatedPositions ? '1' : '0',
        // todo: maxage, stats, history, prefetch
        history: undefined as number | undefined
    }
    if (when) query.history = Math.round(when / 1000)

    const url = endpoint + '?' + qs.stringify(query)
    const res = await fetch(url, {
        mode: 'cors',
        redirect: 'follow',
        headers: {
            ...headers,
            'User-Agent': getRandomUserAgent(),
        },
        referrer: 'no-referrer',
        referrerPolicy: 'no-referrer',
    })
    if (!res.ok) {
        const err = new Error(res.statusText)
        // @ts-ignore
        err.statusCode = res.status
        throw err
    }
    const jsonp = await res.text()
    const data = parse('jsonp', jsonp)
    if (!isObj(data)) throw new Error('response data must be an object')

    const aircraft: AircraftRadar[] = []
    for (let id in data) {
        const d = data[id]
        if (!Array.isArray(d)) continue
        aircraft.push({
            id,
            registration: d[9] ?? null,
            flight: d[13] ?? null,
            callsign: d[16] ?? null,
            origin: d[11] ?? null,
            destination: d[12] ?? null,
            latitude: d[1],
            longitude: d[2],
            altitude: d[4],
            bearing: d[3],
            speed: d[5] ?? null,
            rateOfClimb: d[15],
            isOnGround: !!d[14],
            squawkCode: d[6],
            model: d[8] ?? null,
            modeSCode: d[0] ?? null,
            radar: d[7],
            isGlider: !!d[17],
            timestamp: d[10] ?? null,
        })
    }

    return aircraft
}

export {
    fetchFromRadar,
}
