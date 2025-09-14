// === Autocomplete / Suggested Meals ===
const knownMeals = ["Idli", "Dosa", "Sambar", "Curd Rice", "Upma", "Vada", "Pongal"]; // extend as needed

document.getElementById("mealInput").addEventListener("input", function() {
    const input = this.value.toLowerCase();
    const suggestions = knownMeals.filter(meal => meal.toLowerCase().startsWith(input));
    showSuggestions(suggestions);
});

function showSuggestions(list) {
    let suggestionBox = document.getElementById("mealSuggestions");
    if (!suggestionBox) {
        suggestionBox = document.createElement("div");
        suggestionBox.id = "mealSuggestions";
        suggestionBox.className = "absolute bg-white border border-gray-300 rounded shadow w-2/3 mt-1 z-50";
        document.getElementById("meal-input").appendChild(suggestionBox);
    }
    suggestionBox.innerHTML = list.map(m => `<div class="px-3 py-1 hover:bg-gray-100 cursor-pointer">${m}</div>`).join('');
    suggestionBox.querySelectorAll("div").forEach(item => {
        item.addEventListener("click", () => {
            document.getElementById("mealInput").value = item.textContent;
            suggestionBox.innerHTML = "";
        });
    });
}

// === Main Meal Analysis Function ===
async function analyzeMeal() {
    const meal = document.getElementById("mealInput").value.trim();

    if (!meal) {
        document.getElementById("summary").innerHTML =
            "<p class='text-red-500 font-semibold'>⚠️ Please enter a meal before analyzing.</p>";
        return;
    }

    // Loading states
    ["summary", "suggestions", "macroChart", "microChart", "foodDetails"].forEach(id => {
        document.getElementById(id).innerHTML = id === "summary" ? "<p>⏳ Analyzing your meal...</p>" : "";
    });

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meal })
        });

        if (!response.ok) throw new Error("Failed to fetch results");

        const data = await response.json();

        // === Nutrition Summary ===
        let summaryHTML = "<h2 class='section-title text-xl mb-4'>🍽️ Nutrition Summary</h2><ul class='space-y-2'>";
        for (let key in data.nutrition) {
            summaryHTML += `<li><b>${key}:</b> ${data.nutrition[key]}</li>`;
        }
        summaryHTML += "</ul>";

        // === Toggle Detailed Food Breakdown ===
        if (data.breakdown && data.breakdown.length > 0) {
            summaryHTML += `
              <button onclick="toggleBreakdown()" 
                class="mt-4 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow hover:bg-emerald-600">
                🍛 View Detailed Breakdown
              </button>
              <div id="breakdownBox" class="hidden mt-4 overflow-auto max-h-96">
                <table class="min-w-full text-sm border border-gray-200 rounded-lg">
                  <thead class="bg-gray-100 text-gray-700 sticky top-0">
                    <tr>
                      <th class="px-4 py-2 text-left">Food</th>
                      <th class="px-4 py-2 text-center">Carbs</th>
                      <th class="px-4 py-2 text-center">Protein</th>
                      <th class="px-4 py-2 text-center">Fat</th>
                      <th class="px-4 py-2 text-center">Fiber</th>
                      <th class="px-4 py-2 text-center">Sugar</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    ${data.breakdown.map(item => `
                      <tr>
                        <td class="px-4 py-2 font-medium">${item.food}</td>
                        <td class="px-4 py-2 text-center">${item.carbs}</td>
                        <td class="px-4 py-2 text-center">${item.protein}</td>
                        <td class="px-4 py-2 text-center">${item.fat}</td>
                        <td class="px-4 py-2 text-center">${item.fiber}</td>
                        <td class="px-4 py-2 text-center">${item.sugar}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
        }

        document.getElementById("summary").innerHTML = summaryHTML;

        // === Suggestions ===
        document.getElementById("suggestions").innerHTML =
            "<h2 class='section-title text-xl mb-4'>💡 Suggestions</h2><ul class='list-disc list-inside space-y-1'>" +
            data.suggestions.map(s => `<li>${s}</li>`).join('') +
            "</ul>";

        // === Charts ===
        const macroValues = [data.nutrition.carbs, data.nutrition.protein, data.nutrition.fat];
        const macroLabels = ['Carbs', 'Protein', 'Fat'];
        Plotly.newPlot('macroChart', [{
            values: macroValues,
            labels: macroLabels,
            type: 'pie',
            hole: 0.3,
            marker: { colors: ['#60a5fa','#34d399','#f87171'] }
        }], { title: { text: 'Macronutrients' } });

        const microValues = [data.nutrition.fiber, data.nutrition.sugar, data.nutrition.vitamin_c, data.nutrition.iron];
        const microLabels = ['Fiber', 'Sugar', 'Vitamin C', 'Iron'];
        Plotly.newPlot('microChart', [{
            x: microLabels,
            y: microValues,
            type: 'bar',
            text: microValues.map(v => v.toString()),
            textposition: 'auto',
            marker: { color: ['#3b82f6','#f59e0b','#10b981','#ef4444'] }
        }], { title: { text: 'Micronutrients' } });

        // === Food-wise Cards (optional visual) ===
        const foodContainer = document.getElementById("foodDetails");
        if (data.breakdown && data.breakdown.length > 0) {
            foodContainer.innerHTML = data.breakdown.map(item => `
                <div class="food-card">
                  <h4>${item.food}</h4>
                  <p><b>Carbs:</b> ${item.carbs}</p>
                  <p><b>Protein:</b> ${item.protein}</p>
                  <p><b>Fat:</b> ${item.fat}</p>
                  <p><b>Fiber:</b> ${item.fiber}</p>
                  <p><b>Sugar:</b> ${item.sugar}</p>
                </div>
            `).join('');
        }

    } catch (error) {
        document.getElementById("summary").innerHTML =
            `<p class='text-red-600 font-semibold'>❌ Error: ${error.message}</p>`;
    }
}

// === Toggle Breakdown Function ===
function toggleBreakdown() {
    const box = document.getElementById("breakdownBox");
    box.classList.toggle("hidden");
}
