import { state, settings } from './globalState.js';
import { profileToMatrix } from './utils.js';
import { rules } from './constants.js';

function downloadExport(exportPre, filename) {
    let text = document.getElementById(exportPre).innerText;
    let blob = new Blob([text], { type: 'text/plain' });
    let elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

export function populateExportModal() {
    document.getElementById("matrix-export").innerHTML = profileToMatrix(state);
    // pabulib export
    let resultPabulib = window.pyodide.runPython(`
        election_as_pabulib_string(instance, profile)
    `);
    document.getElementById("pb-export").innerHTML = resultPabulib;
    // button events
    document.getElementById("export-matrix-button").addEventListener("click", () => { downloadExport('matrix-export', 'pb-profile.txt') });
    document.getElementById("export-pb-button").addEventListener("click", () => { downloadExport('pb-export', 'pb-profile.pb') });
}