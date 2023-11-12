import qs from 'querystring'
import _fetch from 'fetch-ponyfill'
import moment from 'moment-timezone'
import {getRandomUserAgent} from './random-user-agent.js'
import type {APIResponse} from "./flight-response.d.ts";

const {fetch} = _fetch()

const endpoint = 'https://data-live.flightradar24.com/clickhandler/'

const headers = {
    'Accept': 'application/json',
}

function calcTimes(time: APIResponse['time'], key: 'arrival' | 'departure', timezone: string | null | undefined) {
    if (!time) {
        return [null, null] as const
    }
    let _val = time.real?.[key] ?? time.estimated?.[key] ?? time.scheduled?.[key]
    const val = _val ? moment.tz(_val * 1000, timezone || '').format() : null
    let _sVal = time.scheduled?.[key]
    const sVal = _sVal ? moment.tz(_sVal * 1000, timezone || '').format() : null

    return [val, sVal] as const
}

const fetchFlight = async (flight: string) => {
    const url = endpoint + '?' + qs.stringify({flight, version: '1.5'})
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
    const d = await res.json() as APIResponse

    const orig = d.airport?.origin
    const dest = d.airport?.destination

    const [dep, sDep] = calcTimes(d.time, 'departure', orig?.timezone?.name)
    const [arr, sArr] = calcTimes(d.time, 'arrival', dest?.timezone?.name)

    const delay = d.time?.historical?.delay ? parseInt(d.time?.historical?.delay) : null

    return {
        id: d.identification?.id ?? null,
        callsign: d.identification?.callsign ?? null,
        liveData: d.status?.live ?? false,
        model: d.aircraft?.model?.code ?? null,
        registration: d.aircraft?.registration ?? null,
        airline: d.airline?.code?.iata ?? null,
        origin: {
            id: orig?.code?.iata ?? null,
            name: orig?.name ?? null,
            coordinates: {
                latitude: orig?.position?.latitude ?? null,
                longitude: orig?.position?.longitude ?? null,
                altitude: orig?.position?.altitude ?? null,
            },
            timezone: orig?.timezone?.name ?? null,
            country: orig?.position?.country?.code ?? null,
        },
        destination: {
            id: dest?.code?.iata ?? null,
            name: dest?.name ?? null,
            coordinates: {
                latitude: dest?.position?.latitude ?? null,
                longitude: dest?.position?.longitude ?? null,
                altitude: dest?.position?.altitude ?? null,
            },
            timezone: dest?.timezone?.name ?? null,
            country: dest?.position?.country?.code ?? null,
        },
        departure: dep || null,
        scheduledDeparture: sDep || null,
        departureTerminal: orig?.info?.terminal ?? null,
        departureGate: orig?.info?.gate ?? null,
        arrival: arr || null,
        scheduledArrival: sArr || null,
        arrivalTerminal: dest?.info?.terminal ?? null,
        arrivalGate: dest?.info?.gate ?? null,
        delay, // in seconds
        // todo: d.time.historical.flighttime
        // todo: d.flightHistory
        // todo: d.trail
        // todo: what is d.s?
    }
}

export {
    fetchFlight,
}
