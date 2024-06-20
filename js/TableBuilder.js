import { settings, state } from './globalState.js';
import { rules, deleteIconHTML } from './constants.js';
import { calculateRules } from './CalculateRules.js';
import { deleteCandidate, deleteVoter, setBudget } from './InstanceManagement.js';
import { sum } from './utils.js';

function updateInputWidths() {
    const totalCost = sum(Object.values(state.cost));
    const numDigits = totalCost.toString().length;
    const inputWidth = Math.max(3, numDigits) * 0.7 + 1.4;
    for (let element of document.getElementsByClassName('cost-input')) {
        element.style.width = inputWidth + 'em';
    }
    document.getElementById("cost-empty-cell").style.width = inputWidth + 'em';
    for (let element of document.getElementsByClassName('approval-button')) {
        element.style.width = inputWidth + 'em';
    }
    document.getElementById('budget-input').style.width = inputWidth + 'em';
}

let previousComputation;
export function buildTable() {
    // check if we can skip computation
    var thisComputation = JSON.stringify([settings, rules, state.N, state.C, state.cost, state.u, state.budget, state.w]);
    if (previousComputation && thisComputation == previousComputation) {
        return;
    }
    previousComputation = thisComputation;

    var table = document.getElementById("profile-table");
    table.replaceChildren(); // clear table
    // header row
    var header = table.createTHead();
    var row = header.insertRow(0);
    var cell = row.insertCell(0);
    var cellWeightHeader = row.insertCell();
    cellWeightHeader.innerHTML = "Weight";
    cellWeightHeader.classList.add("weight-cell")
    if (!settings.useWeights){
        var weightCells = document.getElementsByClassName("weight-cell");
        for (var i = 0; i < weightCells.length; i++) {
            var cell = weightCells[i].classList.toggle("hidden-column");
        }
        //document.getElementById("cost-empty-cell").classList.toggle("hidden-column");
    }

    var styleElement = document.createElement('style');
    document.head.appendChild(styleElement);
    var cssRule = '.hidden-column { display: none; }';
    styleElement.sheet.insertRule(cssRule);

    for (var j of state.C) {
        var cell = row.insertCell();
        cell.innerHTML = j;
        if (j == state.C.length - 1) {
            cell.innerHTML += " " + deleteIconHTML;
            cell.style.padding = "0.4rem 0";
            cell.children[0].style.marginLeft = "-4px";
            cell.children[0].addEventListener("click", function () {
                deleteCandidate(state.C.slice(-1)[0]);
            });
        }
    }
    row.insertCell().className = "empty-cell";
    // voter rows
    var tablebody = table.createTBody();
    for (var i of state.N) {
        var row = tablebody.insertRow();
        row.classList.add("voter-row");
        var cell = row.insertCell();
        cell.innerHTML = "Voter " + (i + 1);
        // allow deletion of last voter
        if (state.N.length > 1 && i == state.N.slice(-1)[0]) {
            row.classList.add("last-voter");
            cell.innerHTML += " " + deleteIconHTML;
            cell.children[0].dataset.voter = i;
            cell.children[0].addEventListener("click", function () {
                deleteVoter(this.dataset.voter);
            });
        }
        var weightCell = row.insertCell();
        weightCell.classList.add("weight-cell");
        if (!settings.useWeights){
            weightCell.classList.add("hidden-column");
        }
        weightCell.id = "voter"+ i + "-weight"
        var weightInput = document.createElement("input");
        weightInput.type = "number";
        weightInput.min = 0;
        weightInput.value = state.w[i]; // Set the initial value to the respective voter's weight
        weightInput.dataset.voter = i; // Store the voter index for later reference
        weightInput.addEventListener("change", function () {
            if (this.value < 0) { // Check if input value is less than 0
                this.value = 1; // Set input value to 0 if less than 0
            }
            this.value = parseFloat(this.value)
            state.w[this.dataset.voter] = parseFloat(this.value); // Update the state with the new weight value
            buildTable();
        });
        weightInput.style.width = "50px"
        weightCell.appendChild(weightInput);
        for (var j of state.C) {
            var cell = row.insertCell();
            cell.id = "voter" + i + "-candidate" + j + "-cell";
            var button = document.createElement("button");
            button.id = "voter" + i + "-candidate" + j + "-button";
            button.dataset.candidate = j;
            button.dataset.voter = i;
            button.className = "approval-button";
            if (state.u[j][i] === 1) {
                button.classList.add("approved");
                button.innerHTML = "✓";
            } else {
                button.classList.add("unapproved");
                button.innerHTML = "✗";
            }
            button.onclick = function () {
                if (state.u[this.dataset.candidate][this.dataset.voter] == 1) {
                    this.classList.remove("approved");
                    this.classList.add("unapproved");
                    this.innerHTML = "✗";
                    state.u[this.dataset.candidate][this.dataset.voter] = 0;
                } else {
                    this.classList.remove("unapproved");
                    this.classList.add("approved");
                    this.innerHTML = "✓";
                    state.u[this.dataset.candidate][this.dataset.voter] = 1;
                }
                buildTable();
            };
            cell.appendChild(button);
        }
        row.insertCell().className = "empty-cell";
    }
    // spacer row
    var row = tablebody.insertRow();
    row.style.height = "0.5em";
    // cost row
    var row = tablebody.insertRow();
    row.classList.add("cost-row");
    var cell = row.insertCell();
    cell.innerHTML = "Cost";
    var costEmptyCell = row.insertCell();
    costEmptyCell.id = "cost-empty-cell"
    if (!settings.useWeights){
        costEmptyCell.classList.add("hidden-column");
    }
    for (var j of state.C) {
        var cell = row.insertCell();
        cell.id = "cost-candidate" + j + "-cell";
        var input = document.createElement("input");
        input.type = "number";
        input.classList.add("cost-input");
        input.id = "cost-candidate" + j + "-input";
        input.dataset.candidate = j;
        input.value = state.cost[j];
        input.min = 1;
        input.addEventListener("change", function () {
            state.cost[this.dataset.candidate] = parseInt(this.value);
            setBudget(state.budget); // update max budget in budget picker
            buildTable();
        });
        cell.appendChild(input);
    }
    // spacer row
    var row = tablebody.insertRow();
    row.style.height = "1em";
    // insert table foot for rule rows
    let tablefoot = table.createTFoot();
    tablefoot.classList.add("rule-table-rows");
    let number_of_rules_selected = Object.values(rules).filter(rule => rule.active).length;
    if (number_of_rules_selected * 33 >= 0.4 * window.innerHeight) {
        // not enough space for sticky
        tablefoot.style.position = 'static';
    }
    if (settings.resolute) {
        // already draw rows for each rule to avoid flickering
        for (let rule in rules) {
            if (!rules[rule].active) {
                continue;
            }
            let row = tablefoot.insertRow();
            row.id = "rule-" + rule + "-row";
            row.classList.add("rule-row");
            let cell = row.insertCell();
            let emptyWeightCell = row.insertCell();
            emptyWeightCell.classList.add('weight-cell')
            if (!settings.useWeights){
                emptyWeightCell.classList.add("hidden-column");
            }
            let span = document.createElement("span");
            span.innerHTML = rules[rule].shortName;
            tippy(span, {
                content: rules[rule].fullName,
                theme: "light",
            });
            cell.appendChild(span);
            for (let j of state.C) {
                let cell = row.insertCell();
                cell.id = "rule-" + rule + "-candidate-" + j + "-cell";
            }
            cell = row.insertCell();
            cell.id = "rule-" + rule + "-property-cell";
            cell.classList.add("empty-cell");
        }
    }
    updateInputWidths();
    if (window.pyodide) {
        // wait for browser to render table
        setTimeout(function () {
            calculateRules();
        }, 0);
    }
}