export interface Airport {
    name: string | null
    code: {
        iata: string
        icao: string
    } | null
    timezone: {
        name: string | null
    } | null
    position: {
        latitude: number | null
        longitude: number | null
        altitude: number | null
        country: {
            code: string | null
        } | null
    } | null
    info: {
        gate: string | null
        terminal: string | null
    } | null
}

// WARNING: incomplete!
export interface APIResponse {
    time: {
        scheduled: {
            arrival: number | null
            departure: number | null
        }
        real: {
            arrival: number | null
            departure: number | null
        }
        estimated: {
            arrival: number | null
            departure: number | null
        }
        historical: {
            delay: string | null
        } | null
    } | null
    identification: {
        id: string | null
        callsign: string | null
    } | null
    airport: {
        origin: Airport | null
        destination: Airport | null
    } | null
    status: {
        live: boolean | null
    } | null
    aircraft: {
        model: {
            code: string | null
        } | null
        registration: string | null
    } | null
    airline: {
        code: {
            iata: string | null
            icao: string | null
        } | null
    } | null
}
