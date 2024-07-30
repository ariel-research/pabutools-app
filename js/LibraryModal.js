import { setRuleActive } from './RuleSelection.js';
import { buildTable } from './TableBuilder.js'; 
import { setInstance } from './InstanceManagement.js';
import { settings } from './globalState.js';

export function populateLibraryModal() {
    for (let button of document.querySelectorAll("#library-list button")) {
        button.addEventListener('click', function () {
            let numCands = parseInt(this.dataset.numCands);
            let k = parseInt(this.dataset.k);
            let costs = JSON.parse(this.dataset.cost);
            let with_weights = this.dataset.weights? "True" : "False";
            let C_ = Array.from(Array(numCands).keys());
            let budget = parseInt(this.dataset.b);
            console.log(budget)
            let profile = this.dataset.profile;
            let result = JSON.parse(window.pyodide.runPython(`
                costs = ${JSON.stringify(C_.map(c => costs[c]))}
                projects = {c : Project(str(c), costs[c]) for c in range(${numCands})}
                instance = Instance()
                instance.update(projects.values())
                instance.project_meta = {projects[c] : {} for c in range(${numCands})}
                instance.meta["description"] = "Exported instance from https://pref.tools/pabutools"
                instance.meta["country"] = "N/A"
                instance.meta["unit"] = "N/A"
                instance.meta["instance"] = "N/A"
                instance.meta["rule"] = "N/A"
                instance.budget_limit = ${budget} ####
                profile = ApprovalProfile()
                if not ${with_weights}:
                    for values, factor in ${this.dataset.profile}:
                        ballot = ApprovalBallot([projects[p] for p in values])
                        profile += [ballot]*factor
                else:
                    w = {}
                    frozen_ballot = []
                    for values, weight in ${this.dataset.profile}:
                        ballot = ApprovalBallot([projects[p] for p in values])
                        frozen_ballot.append((ballot.frozen(), weight))
                        profile.append(ballot)
                    profile = profile.as_multiprofile()
                    for i,(ballot,weight) in enumerate(frozen_ballot):
                        profile[ballot] = weight
                        w[i] = weight
                u = {j : {i : 0 for i in range(len(profile))} for j in range(${numCands})}
                for i, voter in enumerate(frozen_ballot):
                    for candidate in voter[0]:
                        u[int(candidate.name)][i] = 1
                json.dumps({"n" : len(profile), "u" : u, "w": w})
            `));
            let u_ = result.u;
            let w_ = result.w;
            let N_ = Array.from(Array(result.n).keys());
            if (this.dataset.weights){
                settings.useWeights = true;
                let useWeights = document.getElementById("weights");
                useWeights.checked = true;
            } else {
                settings.useWeights = false;
                let useWeights = document.getElementById("weights");
                useWeights.checked = false;
            }
            setInstance(N_, C_, costs, u_, budget, w_);
            if (this.dataset.activateRule) {
                setRuleActive(this.dataset.activateRule, true);
            }
            buildTable();
            window.modals.close();
        });
    }
}