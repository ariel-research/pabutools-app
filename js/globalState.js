export const state = {
    N: 0,
    C: 0,
    cost: {},
    u: {},
    budget: 12,
    storedCommittee: {}
}

export const settings = {
    resolute: true,
    liveMode: true,
    useFractions: false,
    showPropertyinTable: false,
    randomizer: { id: 'IC', p: 0.5 },
    useWeights: false,
}

export let storedLogs = {};

export let pyodide;
export let highs;
export let micropip;

window.state = state;