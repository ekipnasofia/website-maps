import chartManager from "../charts/chartManager.js";

const legendStyle = (config, layerConfig) => (f) => {
  const value = f.properties[layerConfig.styleProperty];
  const legendItems = config.legend.items.filter(
    (i) => i.layer === layerConfig.name
  );
  const legendItem = legendItems.find((item, idx) => {
    const nextItem = legendItems[idx + 1];

    if (nextItem) {
      if (value < nextItem.value) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  });

  return {
    ...layerConfig.styleBase,
    ...legendItem.style,
  };
};

const resetLayerStyle = (lfLayer, layerConfig, viewConfig) => {
  lfLayer.resetStyle();

  if (viewConfig != null) {
    lfLayer.setStyle(viewStyle(viewConfig, layerConfig));
  }
};

// ensures the legend configration is converted from array to objects like `{symbol, value, label, style: {}}`
const normalizeLegendItems = (items) => {
  const result = [];
  let lastValue = -Infinity;

  for (const item of items) {
    const itemObj = {};

    if (Array.isArray(item)) {
      // expects arrays in the form of `[value, color, label]`, where `label` is not required
      const [value, color, label] = item;
      Object.assign(itemObj, {
        symbol: "circle",
        value,
        label,
        style: {
          fillColor: color,
        },
      });
    } else {
      Object.assign(itemObj, item);
    }

    if (!Array.isArray(itemObj.value) && typeof itemObj.value === "number") {
      itemObj.label = itemObj.label ?? `≤ ${itemObj.value}`;
      itemObj.range = [lastValue, itemObj.value];
    } else if (typeof itemObj.value === "string") {
      itemObj.label = itemObj.label ?? itemObj.value;
      itemObj.categories = itemObj.value.split(",").map((i) => i.trim());
    }

    if (itemObj.range) {
      lastValue = itemObj.range[1];
    }

    result.push(itemObj);
  }

  return result;
};
const legendItemMatches = (value, legendItem) => {
  if (legendItem.range) {
    return value > legendItem.range[0] && value <= legendItem.range[1];
  } else if (legendItem.categories) {
    return legendItem.categories.includes(value);
  } else {
    // coerce values if needed
    return value == legendItem.value;
  }
};
const viewStyle = (viewConfig, layerConfig) => (f) => {
  const value = f.properties[viewConfig.attribute];
  const legendItems = normalizeLegendItems(viewConfig.legend.items);
  const legendItem = legendItems.find((i) => legendItemMatches(value, i));
  const legendItemStyle = legendItem?.style ?? {};

  return {
    ...layerConfig.styleBase,
    ...legendItemStyle,
  };
};

const buildLegend = (viewConfig) => {
  const container = L.DomUtil.create("div", "legend");
  const closeBtn = L.DomUtil.create("i", "close", container);
  const contents = L.DomUtil.create("div", "contents", container);
  const legendItems = normalizeLegendItems(viewConfig.legend.items);
  const labels = [];

  closeBtn.innerHTML = "➘";

  closeBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    container.classList.toggle("collapsed");
  });

  labels.push(`<h4 class="header">${viewConfig.label}</h4>`);

  labels.push(`<ul class="legend-items">`);
  for (const legendItem of legendItems) {
    labels.push(`
      <li class="legend-item">
        <i class="symbol ${legendItem.symbol}" style="background-color: ${
      legendItem.style.fillColor ?? legendItem.style.color
    };"></i>
        ${legendItem.label}
      </li>
  `);
  }

  labels.push(`</ul>`);

  if (viewConfig.description) {
    labels.push(`${viewConfig.description}`);
  }

  contents.innerHTML = labels.join("");

  return container;
};

const appendSelectOptions = (selectEl, selectOptions) => {
  for (const opt of selectOptions) {
    const option = L.DomUtil.create("option");

    option.value = opt.value;
    option.innerHTML = opt.label;
    option.disabled = !!opt.disabled;
    option.selected = !!opt.selected;
    selectEl.appendChild(option);
  }
};

L.Control.Legend = L.Control.extend({
  onAdd(map) {
    const div = buildLegend(this.options.viewConfig);

    div.classList.toggle("collapsed", this.options.collapsed);

    return div;
  },

  onRemove(map) {
    // Nothing to do here
  },
});
L.control.legend = function (opts) {
  return new L.Control.Legend(opts);
};

export default async function init(config) {
  const map = L.map("map", { zoomControl: false }).fitBounds(config.mapBounds);
  const lfFilterControl = L.control({ position: "topleft" });
  const lfZoomControl = L.control.zoom({ position: "topleft" });
  const lfSidebarControl = L.control.sidebar("sidebar", { position: "right" });
  const url = new URL(window.location.href);

  const mapState = {
    legendCollapsed: false,
    filterValue: url.searchParams.get("filter"),
    currentView: config.views.selectedView ?? null,
  };
  const layersByName = {};
  const geojsonByName = {};
  const controlsByName = {};

  lfSidebarControl.addTo(map);

  const getViewConfig = (attribute) => {
    for (const viewItem of config.views.items) {
      for (const viewSubitem of viewItem.items) {
        if (viewSubitem.attribute === attribute) {
          return viewSubitem;
        }
      }
    }
  };

  const getLayerConfig = (layerName) =>
    config.layers.find((layerConfig) => layerConfig.name === layerName);

  const filterLayers = () => {
    const filteredLayers = config.layers.filter(
      (layerConfig) => !!layerConfig.filter
    );

    for (const layerConfig of filteredLayers) {
      const lfLayer = layersByName[layerConfig.name];
      const geoJson = geojsonByName[layerConfig.name];

      lfLayer.clearLayers();
      lfLayer.addData(geoJson);

      if (layerConfig.name == config.filter.boundsLayer) {
        const sidebarWidth = document.querySelector('#sidebar').offsetWidth;
        const paddingRight = Math.abs(window.innerWidth - sidebarWidth) < 100 ? 0 : sidebarWidth;

        map.fitBounds(lfLayer.getBounds(), {
          paddingBottomRight: [paddingRight, 0],
        });
      }
    }
  };

  lfFilterControl.onAdd = () => {
    const div = L.DomUtil.create("div");
    const select = L.DomUtil.create("select", "adm-unit", div);

    appendSelectOptions(select, [
      {
        value: "",
        label: "Всички райони",
        selected: true,
      },
    ]);
    div.appendChild(select);

    select.addEventListener("input", (event) => {
      const filterValue = parseInt(event.target.value);
      mapState.filterValue = Number.isNaN(filterValue) ? null : filterValue;

      filterLayers();

      const layerName = config.filter.fromLayer;
      const layerConfig = getLayerConfig(layerName);
      const lfLayer = layersByName[layerName];
      const viewConfig = mapState.currentView
        ? getViewConfig(mapState.currentView)
        : null;
      const featureLayer = lfLayer.getLayer(
        `${layerConfig.name}_${filterValue}`
      );

      if (mapState.currentView) {
        const viewConfig = getViewConfig(mapState.currentView);
        const layerConfig = getLayerConfig(viewConfig.layer);

        layersByName[viewConfig.layer].setStyle(
          viewStyle(viewConfig, layerConfig)
        );
      }

      if (layerConfig.styleHighlight) {
        resetLayerStyle(lfLayer, layerConfig, viewConfig);

        if (mapState.filterValue) {
          featureLayer.setStyle(layerConfig.styleHighlight);
          featureLayer.bringToFront();
        } else {
          lfLayer.resetStyle();
          lfLayer.bringToFront();
        }
      }

      if (featureLayer) {
        showStats(featureLayer.feature);
      } else {
        lfSidebarControl.open("views");
        cleanStats();
      }
    });

    return div;
  };
  lfFilterControl.addTo(map);
  lfZoomControl.addTo(map);

  const updateMapStyling = () => {
    const viewConfig = getViewConfig(mapState.currentView);
    const layerConfig = getLayerConfig(viewConfig.layer);

    layersByName[viewConfig.layer].setStyle(viewStyle(viewConfig, layerConfig));

    if (controlsByName["legend"]) {
      // TODO find a better way to get and store the state of the legend
      mapState.legendCollapsed =
        controlsByName["legend"]._container.classList.contains("collapsed");
      controlsByName["legend"].remove();
    }

    controlsByName["legend"] = L.control
      .legend({
        position: config.legend.position,
        collapsed: mapState.legendCollapsed,
        viewConfig,
        layerConfig,
      })
      .addTo(map);
  };

  const addViews = () => {
    const div = L.DomUtil.create("div", "view");

    // otherwise clicking on elements (e.g. links, inputs etc) in the box makes the whole map to move
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    const panelDescription = config.views.description || "";
    const htmlLines = [panelDescription];

    // htmlLines.push(`<h4 class="header">${config.views.header}</h4>`);
    htmlLines.push(`<ul class="view-items">`);

    for (const viewItem of config.views.items) {
      const subitemsHtmlLines = [];

      for (const viewSubitem of viewItem.items) {
        subitemsHtmlLines.push(`
          <li class="view-item">
            <label>
              <input type="radio" name="view_${viewSubitem.layer}" value="${
          viewSubitem.attribute
        }" ${mapState.currentView === viewSubitem.attribute ? "checked" : ""}>
              ${viewSubitem.label}
            </label>
          </li>
        `);
      }

      htmlLines.push(`
        <li class="view-item">
          ${viewItem.label}
          <ul class="view-subcategories">
            ${subitemsHtmlLines.join("")}
          </ul>
        </li>
      `);
    }

    htmlLines.push(`</ul>`);

    div.innerHTML = htmlLines.join("\n");

    div.querySelectorAll("[data-panel-tab]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        lfSidebarControl.open(btn.dataset.panelTab);
      });
    });

    div.querySelectorAll('input[type="radio"]').forEach((radioEl) => {
      radioEl.addEventListener("change", (event) => {
        mapState.currentView = event.target.value;

        updateMapStyling();
      });
    });

    return div;
  };

  const addBaseChartsContainer = () => {
    addMissingRegionMessageToStatsPanel();

    const div = L.DomUtil.create("div", "chart_description");
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    div.innerHTML = config.charts.description || "";

    div.querySelectorAll("[data-panel-tab]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        lfSidebarControl.open(btn.dataset.panelTab);
      });
    });

    return div;
  };

  const showStats = (feature) => {
    lfSidebarControl.open("stats");
    chartManager.renderCharts(feature.properties);
    addDistrictInfoToQuestionnaireHeader({
      districtName: feature.properties["obns_cyr"],
      numberOfParticipants: feature.properties.q_total_count,
    });
  };
  const hideStats = () => {
    lfSidebarControl.close();
  };

  const cleanStats = () => {
    chartManager.refreshChartSpace();
    addMissingRegionMessageToStatsPanel();
  };

  document.querySelector("#views").appendChild(addViews());
  document
    .querySelector("#charts_header")
    .appendChild(addBaseChartsContainer());

  // parallelize loading of geojson data
  await Promise.all(
    config.layers
      .filter((layerConfig) => layerConfig.type === "geojson")
      .map((layerConfig) =>
        fetch(layerConfig.source)
          .then((resp) => resp.json())
          // cache the loaded geojson for later user
          .then((geojson) => (geojsonByName[layerConfig.name] = geojson))
      )
  );

  for (const layerConfig of config.layers) {
    let lfLayer = null;

    if (layerConfig.type === "tilelayer") {
      lfLayer = L.tileLayer(layerConfig.source, layerConfig.options);
    } else if (layerConfig.type === "geojson") {
      const geojson = geojsonByName[layerConfig.name];

      lfLayer = L.geoJSON(geojson, {
        ...layerConfig.options,
        onEachFeature: (f, fLayer) => {
          // NOTE the _leaflet_id has to be unique across all layers!
          if (layerConfig.idAttribute) {
            const fid = f.properties[layerConfig.idAttribute];
            fLayer._leaflet_id = `${layerConfig.name}_${fid}`;
          }

          if (config.filter.fromLayer === layerConfig.name) {
            fLayer.on({
              click: (event) => {
                const elSelect =
                  lfFilterControl._container.querySelector("select");
                const f = event.target.feature;

                elSelect.value = f.properties["id"];
                elSelect.dispatchEvent(new Event("input", { bubbles: true }));
                elSelect.dispatchEvent(new Event("change", { bubbles: true }));
              },
              popupclose: (_event) => {
                hideStats();
                if (layerConfig.styleHighlight) {
                  const viewConfig = mapState.currentView
                    ? getViewConfig(mapState.currentView)
                    : null;
                  resetLayerStyle(lfLayer, layerConfig, viewConfig);
                }
              },
            });
          }
        },
        // Note: dynamically changing the filter option will have effect only on newly added data. It will not re-evaluate already included features.
        filter: (f) => {
          // the layer is not configured with filter, so render all features
          if (!layerConfig.filter) return true;
          // the filter has no selected value, so render all features
          if (mapState.filterValue == null) return true;

          // check if the the filter value equals to the value of the layer's filter attribute
          // 1) where the filter attribute contains a list of values, e.g. `1, 2, 3`
          if (layerConfig.filter.operator === "comma_list") {
            // console.log(layerConfig.filter.attribute)
            const valueStr = f.properties[layerConfig.filter.attribute];
            const valueArr = valueStr.split(",").map((v) => parseInt(v.trim()));

            return valueArr.includes(mapState.filterValue);
          } else {
            // 2) or where the filter attribute contains the filter value directly, e.g. `1`
            return (
              mapState.filterValue ===
              f.properties[layerConfig.filter.attribute]
            );
          }
        },
      });

      // if (layerConfig.styleProperty) {
      //   layer.setStyle(legendStyle(config, layerConfig));
      // }

      if (layerConfig.popupTmpl) {
        lfLayer.bindPopup((event) => {
          chartManager.renderCharts(event.feature.properties);
          lfSidebarControl.open("stats");
          return Mustache.render(layerConfig.popupTmpl, { f: event.feature });
        });

        lfLayer.getPopup().on("remove", () => {
          lfSidebarControl.close();
        });
      }

      // if the map supports filtering, fill the filter dropdown with values
      if (config.filter && layerConfig.name === config.filter.fromLayer) {
        const options = geojson.features.map((f) => ({
          label: f.properties[config.filter.labelAttribute],
          value: f.properties[config.filter.valueAttribute],
        }));
        const elSelect = lfFilterControl._container.querySelector("select");

        appendSelectOptions(elSelect, options);
      }
    } else {
      throw new Error("Unknown layer type: " + layerConfig.type);
    }

    lfLayer.addTo(map);

    layersByName[layerConfig.name] = lfLayer;
  }

  if (config.sidebar.initialPanel) {
    lfSidebarControl.open(config.sidebar.initialPanel);
  }

  if (mapState.currentView) {
    updateMapStyling();
  }

  if (mapState.filterValue) {
    const elSelect = lfFilterControl._container.querySelector("select");

    elSelect.value = mapState.filterValue;
    elSelect.dispatchEvent(new Event("input", { bubbles: true }));
    elSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // the no-transition is needed only for the initial load of the map
  lfSidebarControl._container.parentNode.classList.remove('sidebar-no-transition');
}

function addDistrictInfoToQuestionnaireHeader({
  districtName,
  numberOfParticipants,
}) {
  const template = `<p>
                <h2 id="questionnaire-district-info">
                    р-н {{districtName}} ({{numberOfParticipants}} попълнили)
                </h2>
              </p>`;

  const div = document.createElement("div");
  div.innerHTML = Mustache.render(template, {
    districtName,
    numberOfParticipants,
  });

  const chartsContainer = document.getElementById("charts_container");
  chartsContainer.insertBefore(div, chartsContainer.firstChild);
}

function addMissingRegionMessageToStatsPanel() {
  document.getElementById("charts_container").innerHTML =
    "<p><h3 id='charts-missing-region-message'>Моля, изберете район от картата.</h3></p>";
}
