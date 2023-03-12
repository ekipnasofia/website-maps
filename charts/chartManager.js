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
    this.render_q8(data);
    this.render_q9(data);
    this.render_q10(data);
    this.render_q5(data);
    this.render_q7(data);
    this.render_q12(data);
  };

  render_q2 = (data) => {
    const questionName = "q2";

    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }

    new ApexCharts(
      this._createChartGroupElement(questionName, questionData.chartLabel),
      {
        series: questionData.answerData,
        chart: {
          type: "pie",
          height: "400px",
        },
        labels: questionData.answerLabels,
        responsive: [
          {
            breakpoint: 400,
            options: {
              chart: {
                width: 300,
              },
              legend: {
                position: "bottom",
              },
            },
          },
          {
            breakpoint: 1360,
            options: {
              chart: {
                width: 300,
              },
              legend: {
                position: "bottom",
              },
            },
          },
        ],
        tooltip: {
          x: {
            show: false,
          },
          y: {
            formatter: function (val, opt) {
              return `${val}%`;
            },
          },
        },
      }
    ).render();
  };

  render_q3 = (data) => {
    const questionName = "q3";
    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }

    renderBarChart({
      chartGroupElement: this._createChartGroupElement(
        questionName,
        questionData.chartLabel
      ),
      chartColor: chartColours[1],
      ...questionData,
      additionalOptions: {
        plotOptions: {
          bar: {
            horizontal: true,
          },
        },
      },
    });
  };

  render_q4 = (data) => {
    const questionName = "q4";
    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }

    renderBarChart({
      chartGroupElement: this._createChartGroupElement(
        questionName,
        questionData.chartLabel
      ),
      chartColor: chartColours[2],
      ...questionData,
    });
  };

  render_q10 = (data) => {
    const questionName = "q10";
    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }
    renderBarChart({
      chartGroupElement: this._createChartGroupElement(
        questionName,
        questionData.chartLabel
      ),
      chartColor: chartColours[3],
      ...questionData,
    });
  };

  render_q12 = (data) => {
    const questionName = "q12";
    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }

    const answerData = percentageArray(questionData.answerData);
    new ApexCharts(
      this._createChartGroupElement(questionName, questionData.chartLabel),
      {
        chart: {
          type: "bar",
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            barHeight: "90%",
            horizontal: true,
          },
        },
        colors: ["#33b2df"],
        dataLabels: {
          enabled: true,
          textAnchor: "start",
          style: {
            colors: ["#fff"],
            left: 2,
          },
          dropShadow: {
            enabled: true,
          },
          formatter: function (val) {
            return `${val}%`;
          },
        },
        series: [{ data: answerData }],
        xaxis: {
          categories: questionData.answerLabels.map((label) =>
            splitString(label)
          ),
          labels: { rotate: 0 },
        },
        tooltip: {
          theme: "dark",
          custom: function ({ series, seriesIndex, dataPointIndex, w }) {
            return `<div id="chart-tooltip-percentage">${series[seriesIndex][dataPointIndex]} %</div>`;
          },
        },
      }
    ).render();
  };

  render_q5 = (data) => {};

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

    const priorityImportanceObject = createDataObjectDescending(
      Object.values(subQuestions),
      answerData
    );

    let responsivenessOptions = {};
    if (window.innerWidth > 550) {
      responsivenessOptions = {
        chart: {
          type: "bar",
          height: "1400px",
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            barHeight: "90%",
            horizontal: true,
            dataLabels: {
              position: "bottom",
            },
          },
        },
        dataLabels: {
          enabled: true,
          textAnchor: "start",
          style: {
            colors: ["black"],
            left: 2,
            borderColor: "#000",
            borderWidth: 1,
          },
          formatter: function (val, opt) {
            const label = opt.w.globals.labels[opt.dataPointIndex];
            return label;
          },
          offsetY: -8,
        },
        xaxis: {
          categories: Object.keys(priorityImportanceObject).map((label) =>
            splitString(label, 60)
          ),
          labels: {
            rotate: 0,
          },
        },
      };
    } else {
      responsivenessOptions = {
        chart: {
          type: "bar",
          height: "1700px",
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            barHeight: "95%",
            horizontal: true,
            dataLabels: {
              position: "bottom",
            },
          },
        },
        dataLabels: {
          enabled: true,
          textAnchor: "start",
          style: {
            colors: ["black"],
            left: 2,
            borderColor: "#000",
            borderWidth: 1,
          },
          formatter: function (val, opt) {
            const label = opt.w.globals.labels[opt.dataPointIndex];
            return [...label.slice(0, -1), label[label.length - 1]];
          },
          offsetY: -15,
        },
        xaxis: {
          categories: Object.keys(priorityImportanceObject).map((label) =>
            splitString(label, 33)
          ),
          labels: {
            rotate: 0,
          },
        },
      };
    }

    new ApexCharts(this._createChartGroupElement(questionName, chartLabel), {
      series: [
        {
          data: Object.values(priorityImportanceObject),
        },
      ],
      fill: {
        colors: [
          function ({ value, seriesIndex, w }) {
            const maxNum = 6;
            const startColor = [74, 74, 74];
            const endColor = [189, 245, 47];
            const r = Math.round(
              ((endColor[0] - startColor[0]) / maxNum) * value + startColor[0]
            );
            const g = Math.round(
              ((endColor[1] - startColor[1]) / maxNum) * value + startColor[1]
            );
            const b = Math.round(
              ((endColor[2] - startColor[2]) / maxNum) * value + startColor[2]
            );
            return `rgb(${r}, ${g}, ${b})`;
          },
        ],
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      tooltip: {
        theme: "dark",
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          return `<div id="chart-tooltip-percentage">${series[seriesIndex][dataPointIndex]} / 6</div>`;
        },
      },
      ...responsivenessOptions,
    }).render();
  };

  render_q8 = (data) => {
    const questionName = "q8";
    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }

    const chartData = percentageArray(questionData.answerData);
    new ApexCharts(
      this._createChartGroupElement(questionName, questionData.chartLabel),
      {
        series: [
          {
            name: questionData.answerLabels[0],
            data: [chartData[0]],
          },
          {
            name: questionData.answerLabels[1],
            data: [chartData[1]],
          },
          {
            name: questionData.answerLabels[2],
            data: [chartData[2]],
          },
        ],
        chart: {
          type: "bar",
          height: "100%",
          stacked: true,
          stackType: "100%",
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: true,
            dataLabels: {
              total: {
                enabled: true,
                style: {
                  fontSize: "13px",
                  fontWeight: 900,
                },
              },
            },
          },
        },
        xaxis: {
          labels: {
            formatter: function (value) {
              return "";
            },
          },
        },
        dataLabels: {
          offsetX: 7,
        },
        stroke: {
          width: 1,
          colors: ["#fff"],
        },
        yaxis: {
          labels: {
            show: false,
          },
        },
        legend: {
          position: "top",
          horizontalAlign: "left",
          offsetX: 40,
        },
        tooltip: {
          x: {
            show: false,
          },
          y: {
            formatter: function (val, opt) {
              return `${val}%`;
            },
          },
        },
      }
    ).render();
  };

  render_q9 = (data) => {
    const questionName = "q9";
    const questionData = getQuestionData(data, questionName);
    if (!questionData) {
      return;
    }

    const chartData = percentageArray(questionData.answerData);

    new ApexCharts(
      this._createChartGroupElement(questionName, questionData.chartLabel),
      {
        series: chartData,
        labels: questionData.answerLabels,
        legend: {
          show: false,
        },
        chart: {
          type: "polarArea",
          height: "400px",
        },
        stroke: {
          colors: ["#fff"],
        },
        fill: {
          opacity: 0.8,
        },
        tooltip: {
          y: {
            show: true,
            title: {
              formatter: function (val, opt) {
                return `${val} - ${opt.series[opt.seriesIndex]}%`;
              },
            },
          },
        },
        dataLabels: {
          enabled: true,
          enabledOnSeries: true,
          formatter: function (val, opt) {
            return `${opt.w.globals.seriesNames[opt.seriesIndex]} - ${
              opt.w.globals.series[opt.seriesIndex]
            }%`;
          },
        },
        yaxis: {
          labels: {
            formatter: function (value) {
              return "";
            },
          },
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                height: 300,
              },
              legend: {
                position: "bottom",
              },
              dataLabels: {
                offsetX: -60,
              },
            },
          },
        ],
      }
    ).render();
  };

  _refreshChartSpace = () => {
    while (this.chartsContainer.firstChild) {
      this.chartsContainer.removeChild(this.chartsContainer.firstChild);
    }
  };

  _createChartGroupElement = (questionName, title) => {
    const chartGroupId = `chart-${questionName}`;
    const chartGroupTemplate = `
      <div class="chart-group">
        <h5>{{title}}</h5>
        <div id="{{chartGroupId}}" class="chart-group-chart" ></div>
      </div>
    `;

    const rendered = Mustache.render(chartGroupTemplate, {
      chartGroupId,
      title,
    });

    const parser = new DOMParser();
    const chartGroupElement = parser
      .parseFromString(rendered, "text/html")
      .querySelector("div");
    this.chartsContainer.appendChild(chartGroupElement);
    return document.getElementById(chartGroupId);
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
  chartColor,
  additionalOptions,
}) {
  if (!additionalOptions) {
    additionalOptions = {};
  }

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
    tooltip: {
      theme: "dark",
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        return `<div id="chart-tooltip-percentage">${series[seriesIndex][dataPointIndex]} %</div>`;
      },
    },
    xaxis: {
      categories: answerLabels.map((label) => splitString(label)),
      labels: {
        rotate: 0,
        style: 9,
      },
    },
    responsive: [
      {
        breakpoint: 450,
        options: {
          xaxis: {
            labels: {
              style: {
                fontSize: "9px",
              },
            },
          },
        },
      },
    ],
    ...additionalOptions,
  }).render();
}

function splitString(str, maxLength = 13) {
  if (!maxLength) {
    maxLength = 13;
  }

  if (!maxLength && window.innerWidth < 500) {
    maxLength = 10;
  }

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

function createDataObjectDescending(labels, values) {
  const obj = {};
  const arrOfObj = [];

  for (let i = 0; i < labels.length; i++) {
    arrOfObj.push({ label: labels[i], value: values[i] });
  }

  arrOfObj.sort((a, b) => b.value - a.value);

  for (let i = 0; i < arrOfObj.length; i++) {
    obj[arrOfObj[i].label] = arrOfObj[i].value;
  }

  return obj;
}
