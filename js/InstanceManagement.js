import { state, settings } from './globalState.js';
import { buildTable } from './TableBuilder.js';
import { sum } from './utils.js';

export function addVoter() {
    let newVoter = state.N.slice(-1)[0] + 1;
    state.N.push(newVoter);
    for (let j of state.C) {
        state.u[j][newVoter] = 0;
    }
    buildTable();
}

export function addCandidate() {
    let newCandidate = state.C.slice(-1)[0] + 1;
    state.C.push(newCandidate);
    state.cost[newCandidate] = 1;
    state.u[newCandidate] = {};
    for (let i of state.N) {
        state.u[newCandidate][i] = 0;
    }
    document.getElementById('budget-input').max = state.C.length - 1;
    buildTable();
}

export function deleteCandidate(candidate) {
    state.C.splice(state.C.indexOf(parseInt(candidate)), 1);
    if (state.budget > state.C.length - 1) {
        setBudget(state.C.length - 1);
    }
    document.getElementById('budget-input').max = state.C.length - 1;
    document.getElementById('budget-range').max = state.C.length - 1;
    buildTable();
}

export function deleteVoter(voter) {
    state.N.splice(state.N.indexOf(parseInt(voter)), 1);
    buildTable();
}

export function setInstance(N_, C_, cost_, u_, budget_, w_) {
    state.N = N_;
    state.C = C_;
    state.cost = cost_;
    state.u = u_;
    state.w = w_;
    setBudget(budget_);
    buildTable();
}

export function setBudget(budget_) {
    const totalCost = sum(Object.values(state.cost));
    document.getElementById('budget-input').max = totalCost;
    document.getElementById('budget-range').max = totalCost;
    state.budget = Math.max(Math.min(budget_, totalCost), 1);
    document.getElementById('budget-input').value = state.budget;
    document.getElementById('budget-range').value = state.budget;
}

export function loadMatrix(matrix, standard=false) {
    console.log("standard: ", standard)
    var lines = matrix.split('\n');
    // remove empty lines
    lines = lines.filter(line => line.length > 0);
    console.log("lines: ", lines)
    // check that all lines have the same length
    let no_weights = standard || !settings.useWeights
    console.log("no weights: ", no_weights)
    if (((no_weights &&
        lines.every(line => line.length === lines[0].length)) ||
        settings.useWeights &&
        lines.every(line => line.split('*')[1].length === lines[0].split('*')[1].length))) {
        let numCands = lines[0].length;
        if (settings.useWeights && !standard){
            numCands = lines[0].split('*')[1].length;
        }
        let numVoters = lines.length;
        console.log(numCands)
        let N_ = Array.from(Array(numVoters).keys());
        let C_ = Array.from(Array(numCands).keys());
        let cost_ = {};
        let u_ = {};
        let w_ = {};
        let weightsString = []
        if (!no_weights){
            for (let k in N_){
                weightsString[k] = lines[k].split('*')[0]
                w_[k] = parseFloat(weightsString[k])
            }
            for (let j of C_) {
                cost_[j] = 1;
                u_[j] = {};
                for (let i of N_) {
                    u_[j][i] = parseInt(lines[i][j+weightsString[i].length+1]);
                }
            }
        } else {
            for (let k in N_){
                w_[k] = 1
            }
            for (let j of C_) {
                cost_[j] = 1;
                u_[j] = {};
                for (let i of N_) {
                    u_[j][i] = parseInt(lines[i][j]);
                }
            }
        }
        setInstance(N_, C_, cost_, u_, state.budget, w_);
        return true;
    } else {
        return false;
    }
}
