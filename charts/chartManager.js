import "https://cdn.jsdelivr.net/npm/chart.js";
import { questions } from "./questionMapping.js";

// function renderGraph() {

//   new Chart(canvas, {
//     type: "bar",
//     data: {
//       labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
//       datasets: [
//         {
//           label: "# of Votes",
//           data: [12, 19, 3, 5, 2, 3],
//           borderWidth: 1,
//         },
//       ],
//     },
//     options: {
//       scales: {
//         y: {
//           beginAtZero: true,
//         },
//       },
//     },
//   });

//   container.appendChild(canvas);
// }

// window.renderGraph = renderGraph;

class ChartManager {
  constructor() {
    this.currentChart = 0;
    this.charts = ["q2", "q3"];
  }

  renderInitialChart(data) {
    const renderMethod = this[`render_${this.charts[this.currentChart]}`];
    const canvas = this._refreshCanvas();
    renderMethod(data, canvas);
  }

  renderNextChart(data) {}

  render_q2(data, canvas) {

    // TODO abstract common logic for render methods for questions


    const questionName = "q2";

    const answerData = getAnswerDataAsArray(data, questionName);

    const { label: chartLabel, options: answerLabels } =
      questions[questionName];

    new Chart(canvas, {
      type: "bar",
      data: {
        labels: Object.values(answerLabels),
        datasets: [
          {
            label: chartLabel,
            data: answerData,
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  _refreshCanvas() {
    const container = document.getElementById("chart_container");

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    return canvas;
  }
}

function getAnswerDataAsArray(data, questionName) {
  return Object.keys(data)
    .filter((key) => key.startsWith(questionName))
    .sort((a, b) => {
      const idA = a.split("_")[1];
      const idB = b.split("_")[1];
      return idA.localeCompare(idB);
    })
    .map((key) => data[key]);
}

export default new ChartManager();
