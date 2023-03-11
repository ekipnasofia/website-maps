import { questions } from "./questionMapping.js";

const chartColours = [
  "#33b2df",
  "#546E7A",
  "#d4526e",
  "#13d8aa",
  "#A5978B",
  "#2b908f",
  "#f9a3a4",
  "#90ee7e",
  "#f48024",
  "#69d2e7",
];

class ChartManager {
  constructor() {
    this.chartsContainer = document.getElementById("charts_container");
  }

  renderCharts = (data) => {
    this._refreshChartSpace();
    this.render_q2(data);
    this.render_q3(data);
    this.render_q4(data);
    this.render_q5(data);
    this.render_q7(data);
  };

  render_q2 = (data) => {
    const questionName = "q2";

    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }

    renderBarChart({
      chartGroupElement: this._createChartGroupElement(questionName),
      chartColor: chartColours[0],
      ...questionData,
    });
  };

  render_q3 = (data) => {
    const questionName = "q3";
    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }

    renderBarChart({
      chartGroupElement: this._createChartGroupElement(questionName),
      chartColor: chartColours[1],
      ...questionData,
    });
  };

  render_q4 = (data) => {
    const questionName = "q4";
    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }

    renderBarChart({
      chartGroupElement: this._createChartGroupElement(questionName),
      chartColor: chartColours[2],
      ...questionData,
    });
  };

  render_q5 = (data) => {
    const questionName = "q10";
    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }
    renderBarChart({
      chartGroupElement: this._createChartGroupElement(questionName),
      chartColor: chartColours[3],
      ...questionData,
    });
  };

  render_q7 = (data) => {
    const questionName = "q7";

    const { label: chartLabel, subQuestions } = questions[questionName];
    const answerData = Object.keys(data)
      .filter((key) => key.startsWith(questionName) && key.includes("avg"))
      .sort((a, b) => {
        const idA = a.split("_")[1];
        const idB = b.split("_")[1];
        return idA.localeCompare(idB);
      })
      .map((key) => data[key].toFixed(2));

    if (!answerData) {
      return;
    }

    new ApexCharts(this._createChartGroupElement(questionName), {
      // dataLabels: {
      //   formatter: (val) => `${val}%`,
      // },
      chart: {
        type: "bar",
        height: "1000px",
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
        }
      },
      series: [
        {
          data: answerData,
        },
      ],
      xaxis: {
        categories: Object.values(subQuestions).map((label) =>
          splitString(label, 20)
        ),
        labels: {
          rotate: 0,
        },
      },
      title: {
        text: splitString(chartLabel, 40),
        align: "center",
      },
    }).render();
  };

  _refreshChartSpace = () => {
    while (this.chartsContainer.firstChild) {
      this.chartsContainer.removeChild(this.chartsContainer.firstChild);
    }
  };

  _createChartGroupElement = (questionName) => {
    const chartGroupTemplate = `
      <div style="padding: 1rem 0">
        <div id="{{chartGroupId}}" ></div>
      </div>
    `;

    const rendered = Mustache.render(chartGroupTemplate, {
      chartGroupId: `chart-${questionName}`,
    });

    const parser = new DOMParser();
    const chartGroupElement = parser
      .parseFromString(rendered, "text/html")
      .querySelector("div");
    this.chartsContainer.appendChild(chartGroupElement);
    return chartGroupElement;
  };
}

export default new ChartManager();

/* 

Question data utils 

*/
const getAnswerDataAsArray = (data, questionName) => {
  return Object.keys(data)
    .filter((key) => key.startsWith(questionName) && key.includes("count"))
    .sort((a, b) => {
      const idA = a.split("_")[1];
      const idB = b.split("_")[1];
      return idA.localeCompare(idB);
    })
    .map((key) => data[key]);
};

const getQuestionData = (data, questionName) => {
  const answerData = getAnswerDataAsArray(data, questionName);

  if (answerData.every((value) => value == null)) {
    return false;
  }

  let { label: chartLabel, options: answerLabels } = questions[questionName];

  answerLabels = Object.values(answerLabels);
  return { chartLabel, answerLabels, answerData };
};

/*  

Chart utils

*/

function renderBarChart({
  chartGroupElement,
  answerData,
  answerLabels,
  chartLabel,
  chartColor,
}) {
  new ApexCharts(chartGroupElement, {
    dataLabels: {
      formatter: (val) => `${val}%`,
    },
    colors: [chartColor],
    chart: {
      type: "bar",
      height: "350px",
      toolbar: {
        show: false,
      },
    },
    series: [
      {
        data: percentageArray(answerData),
      },
    ],
    xaxis: {
      categories: answerLabels.map((label) => splitString(label)),
      labels: {
        rotate: 0,
      },
    },
    title: {
      text: splitString(chartLabel, 40),
      align: "center",
    },
  }).render();
}

function splitString(str, maxLength = 13) {
  const words = str.split(" ");
  const result = [];
  let currentString = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (currentString.length + word.length <= maxLength) {
      currentString += currentString === "" ? word : " " + word;
    } else {
      result.push(currentString);
      currentString = word;
    }
  }

  if (currentString !== "") {
    result.push(currentString);
  }

  return result;
}

function percentageArray(arr) {
  const sum = arr.reduce((total, value) => total + value, 0);
  return arr.map((value) => ((value / sum) * 100).toFixed(2));
}
