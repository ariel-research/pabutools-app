import { state, settings } from './globalState.js';
import { rules, properties, infoIconHtml } from './constants.js';
import { debounce, sum, round2, profileToMatrix } from './utils.js';
import { setRuleActive, populateRuleChoiceModal } from './RuleSelection.js';
import { populateExportModal } from './ExportModal.js';
import { populateRandomizerModal, randomize } from './Randomizer.js';
import { copyURL, readURL } from './URL.js';
import { copyMatrix, pasteMatrix } from './clipboard.js';
import { setUpDragDropHandlers } from './FileDrop.js';
import { loadPython } from './loadPython.js';
import { buildTable } from './TableBuilder.js'; 
import { startLog, getLog, storedLogs, logger } from './logger.js';
import { addVoter, addCandidate, setBudget, loadMatrix } from './InstanceManagement.js';
import { populateLibraryModal } from './LibraryModal.js';
import { addSettingChangeHandlers, changeUseWeightSetting } from './SettingsManagement.js';

window.logger = logger;

function dismissAbout() {
    document.getElementById("dismissable-about").style.display = "none";
    window.localStorage.setItem("dismissed-about", "true");
}

function runHighs(LpInput) {
    let result = window.highs.solve(LpInput);
    return JSON.stringify(result);
}

window.runHighs = runHighs;

document.addEventListener('DOMContentLoaded', function () {
    if (window.localStorage.getItem("dismissed-about") === "true") {
        dismissAbout();
    }
    document.getElementById("dismiss-button").addEventListener('click', dismissAbout);

    if (window.location.search) {
        readURL();
    } else {
        let matrix = "111100000000\n111010000000\n111001000000\n000000111000\n000000000111";
        matrix = "11000\n11100\n11000\n11100\n11100\n11000\n00111\n00010\n00011\n00111\n10000"
        loadMatrix(matrix);
        state.cost = [700, 400, 250, 200, 100];
        setBudget(1100);
        buildTable();
    }

    setUpDragDropHandlers();

    // disable all buttons and inputs while loading
    document.querySelectorAll("button, input").forEach(function (el) {
        el.disabled = true;
    });

    document.getElementById("budget-input").addEventListener('input', function () {
        setBudget(parseInt(document.getElementById("budget-input").value));
        buildTable();
    });
    document.getElementById("budget-range").addEventListener('input', function () {
        setBudget(parseInt(document.getElementById("budget-range").value));
        buildTable();
    });

    document.getElementById("add-voter-button").addEventListener('click', addVoter);
    document.getElementById("add-candidate-button").addEventListener('click', addCandidate);
    document.getElementById("random-button").addEventListener('click', randomize);
    document.getElementById("export-button").addEventListener('click', populateExportModal);
    document.getElementById("copy-url-button").addEventListener('click', copyURL);
    document.getElementById("copy-button").addEventListener('click', copyMatrix);
    document.addEventListener('paste', pasteMatrix);

    addSettingChangeHandlers();
    changeUseWeightSetting();
    
    tippy('[data-tippy-content]', { theme: "light", });
    window.modals = new HystModal({
        linkAttributeName: "data-hystmodal",
        beforeOpen: function (modal) {
            tippy.hideAll();
        },
        afterClose: function (modal) {
            buildTable();
        },
    });
    populateRuleChoiceModal();
    setRuleActive("av", true);
    populateRandomizerModal(true);
    populateLibraryModal();

    loadPython();

});