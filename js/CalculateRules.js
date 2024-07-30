import { settings, state } from './globalState.js';
import { rules, properties } from './constants.js';

function computeTiedCommittees() {
    let rule = document.getElementById("compute-tied-committees-button").dataset.rule;
    let result = _calculateRule(rule, true)[0];
    let pre = document.getElementById("committee-info-modal-all-committees");
    pre.innerHTML = "";
    pre.innerHTML = result.map(committee => committee.join(",")).join("\n");
}

function populateCommitteeInfoModal(rule) {
    document.getElementById("compute-tied-committees-button").dataset.rule = rule;
    document.getElementById("compute-tied-committees-button").addEventListener("click", computeTiedCommittees);
    let pre = document.getElementById("committee-info-modal-all-committees");
    pre.innerHTML = "";
    // compute properties
    setTimeout(() => {
        let propList = document.getElementById("committee-info-modal-properties-list");
        propList.innerHTML = "";
        for (let prop in properties) {
            let result = window.pyodide.runPython(`
                properties.check("${prop}", profile, ${JSON.stringify(state.storedCommittee[rule])})
            `);
            let details = document.createElement("details");
            let summary = document.createElement("summary");
            if (result) {
                summary.classList.add("satisfied");
                summary.innerHTML = properties[prop].fullName + ": ✓ satisfied";
            } else {
                summary.classList.add("failed");
                summary.innerHTML = properties[prop].fullName + ": ✗ failed";
            }
            details.appendChild(summary);
            let pre = document.createElement("pre");
            // pre.innerHTML = info.join("\n");
            details.appendChild(pre);
            propList.appendChild(details);
        }
    }, 0);
}

function _calculateRule(rule, forceIrresolute = false) {
    let result;
    if (settings.resolute && !forceIrresolute) {
        result = window.pyodide.runPython(`
            committee = ${rules[rule].command}
            results = [[int(c.name) for c in committee]]
            json.dumps(results)
        `);
    } else {
        result = window.pyodide.runPython(`
            committees = ${rules[rule].command.replace(")", ", resoluteness=False)")}
            results = [[int(c.name) for c in committee] for committee in committees]
            json.dumps(results)
        `);
    }
    return JSON.parse(result);
}

export async function calculateRules() {
    if (!settings.liveMode) {
        return;
    }
    
    let weights = "[]"
    if(settings.useWeights){
        weights = "["
        for (let i in state.w){
            weights += state.w[i] + ","
        }
        weights+="]"
    }
    let profileString = "[";
    let voters = []
    for (let i of state.N) {
        let voterString = "ApprovalBallot([";
        let ballotIsEmpty = true;   
        for (let j of state.C) {
            if (state.u[j][i] == 1) {
                voterString += `projects[${j}],`;
                ballotIsEmpty = false;
            }
        }
        if (!ballotIsEmpty) {
            voterString = voterString.slice(0, -1); // remove trailing comma
        }
        voterString += "])";
        voters.push(voterString)
        profileString += voterString + ",";
    }
    profileString = profileString.slice(0, -1) + "]"; // remove trailing comma
    window.pyodide.runPython(`
        costs = ${JSON.stringify(state.C.map(c => state.cost[c]))}
        projects = {c : Project(str(c), costs[c]) for c in range(${state.C.length})}
        instance = Instance()
        instance.update(projects.values())
        instance.project_meta = {projects[c] : {} for c in range(${state.C.length})}
        instance.meta["description"] = "Exported instance from https://pref.tools/pabutools"
        instance.meta["country"] = "N/A"
        instance.meta["unit"] = "N/A"
        instance.meta["instance"] = "N/A"
        instance.meta["rule"] = "N/A"
        instance.budget_limit = ${state.budget}
        if "${settings.useWeights}" == "true": 
            voters = []
            voters_frozen = []
            for voter in ${voters}:
                voters.append(voter)
                voters_frozen.append(voter.frozen())
            profile = ApprovalProfile(voters)
            profile = profile.as_multiprofile()
            weights = ${weights}
            for i,voter in enumerate(voters_frozen):
                profile[voter]=weights[i]
        else:
            profile = ApprovalProfile(${profileString})
    `);
    
    let table = document.getElementById("profile-table");
    let tBody = table.getElementsByTagName("tbody")[0];
    for (let rule in rules) {
        if (!rules[rule].active) {
            continue;
        }
        if (settings.resolute) {
            setTimeout(() => {
                let result = _calculateRule(rule);
                for (let committee of result) {
                    state.storedCommittee[rule] = committee;
                    for (let j of state.C) {
                        let cell = document.getElementById("rule-" + rule + "-candidate-" + j + "-cell");
                        if (committee.includes(j)) {
                            cell.innerHTML = "✓";
                            cell.classList.add("in-committee");
                        } else {
                            cell.innerHTML = "";
                            cell.classList.add("not-in-committee");
                        }
                    }
                }
                let row = document.getElementById("rule-" + rule + "-row");
                row.dataset.hystmodal = "#committee-info-modal";
                row.onclick = function () {
                    populateCommitteeInfoModal(rule);
                };
                if (settings.showPropertyinTable) {
                    setTimeout(() => {
                        let cell = document.getElementById("rule-" + rule + "-property-cell");
                        let result = window.pyodide.runPython(`
                            properties.check("${settings.showPropertyinTable}", profile, ${JSON.stringify(state.storedCommittee[rule])})
                        `);
                        if (result) {
                            let span = document.createElement("span");
                            span.classList.add("property-cell-satisfied");
                            span.innerHTML = "✓ " + properties[settings.showPropertyinTable].shortName;
                            cell.appendChild(span);
                        } else {
                            let span = document.createElement("span");
                            span.classList.add("property-cell-failed");
                            span.innerHTML = "✗ " + properties[settings.showPropertyinTable].shortName;
                            cell.appendChild(span);
                        }
                    }, 0);
                }
            }, 0);
        } else {
            let result = await _calculateRule(rule);
            // add to table
            for (let committee of result) {
                // need to add rows
                let row = tBody.insertRow();
                let cell = row.insertCell();
                let span = document.createElement("span");
                span.innerHTML = rules[rule].shortName;
                tippy(span, {
                    content: rules[rule].fullName,
                    theme: "light",
                });
                cell.appendChild(span);
                for (let j of state.C) {
                    let cell = row.insertCell();
                    if (committee.includes(j)) {
                        cell.innerHTML = "✓";
                    } else {
                        cell.innerHTML = "";
                    }
                }
            }
        }
    }
    return true;
}

export async function rulesDontSupportWeight(){
    if (!settings.liveMode) {
        return;
    }
    for (let rule in rules) {
        if (!rules[rule].active) {
            continue;
        }
        handleRuleDoesntSupportWeight(rule)
    }
}

function handleRuleDoesntSupportWeight(rule){
    if (settings.useWeights && !rules[rule].weight){
        for (let j of state.C) {
            let cell = document.getElementById("rule-" + rule + "-candidate-" + j + "-cell");
            cell.innerHTML = "";
            cell.className = "";
        }
        let row = document.getElementById("rule-" + rule + "-row");
        row.classList.remove("rule-row")
        return true
    }
    return false
}