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

// expects arrays in the form of `[value, color, label]`, where `label` is not required
const normalizeLegendItem = ([value, color, label]) => ({
  symbol: "circle",
  value,
  label: label ?? `< ${value}`,
  style: { color },
});
// ensures the legend configration is converted from array to objects like `{symbol, value, label, style: {}}`
const normalizeLegendItems = (items) =>
  items.map((i) => (Array.isArray(i) ? normalizeLegendItem(i) : i));

const viewStyle = (viewConfig, layerConfig) => (f) => {
  const value = f.properties[viewConfig.attribute];
  const legendItems = normalizeLegendItems(viewConfig.legend.items);
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
  const districtControl = L.control({ position: "topleft" });
  const sidebar = L.control.sidebar("sidebar", { position: "right" });
  const mapState = {
    legendCollapsed: false,
  };
  const layersByName = {};
  const controlsByName = {};

  sidebar.addTo(map);

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

  districtControl.onAdd = () => {
    const div = L.DomUtil.create("div");
    const select = L.DomUtil.create("select", "adm-unit", div);

    appendSelectOptions(select, [{
      value: -1,
      label: 'Избор на район...',
      disabled: true,
      selected: true,
    }]);
    div.appendChild(select);

    return div;
  };
  districtControl.addTo(map);

  const addViews = () => {
    const div = L.DomUtil.create("div", "view");

    // otherwise clicking on elements (e.g. links, inputs etc) in the box makes the whole map to move
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    const htmlLines = [];

    // htmlLines.push(`<h4 class="header">${config.views.header}</h4>`);
    htmlLines.push(`<ul class="view-items">`);

    for (const viewItem of config.views.items) {
      const subitemsHtmlLines = [];

      for (const viewSubitem of viewItem.items) {
        subitemsHtmlLines.push(`
          <li class="view-item">
            <label>
              <input type="radio" name="view_${viewSubitem.layer}" value="${viewSubitem.attribute}">
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

    div.querySelectorAll('input[type="radio"]').forEach((radioEl) => {
      radioEl.addEventListener("change", (event) => {
        const viewConfig = getViewConfig(event.target.value);
        const layerConfig = getLayerConfig(viewConfig.layer);

        layersByName[viewConfig.layer].setStyle(
          viewStyle(viewConfig, layerConfig)
        );

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
      });
    });

    return div;
  };

  document.querySelector("#views").appendChild(addViews());

  for (const layerConfig of config.layers) {
    let layer = null;

    if (layerConfig.type === "tilelayer") {
      layer = L.tileLayer(layerConfig.source, layerConfig.options);
    } else if (layerConfig.type === "geojson") {
      const geoJson = await fetch(layerConfig.source).then((resp) =>
        resp.json()
      );
      layer = L.geoJSON(geoJson, {
        ...layerConfig.options,
        onEachFeature: (f, fLayer) => {
          if (layerConfig.styleHighlight) {
            fLayer.on({
              click: (event) => {
                event.target.setStyle(layerConfig.styleHighlight);
                layer.bringToFront();
              },
              popupclose: (event) => {
                layer.resetStyle(event.target);
              },
            });
          }
        },
      });

      // if (layerConfig.styleProperty) {
      //   layer.setStyle(legendStyle(config, layerConfig));
      // }

      if (layerConfig.popupTmpl) {
        layer.bindPopup((event) =>
          Mustache.render(layerConfig.popupTmpl, { f: event.feature })
        );
      }

      if (layerConfig.name === config.districtsLayer) {
        const options = geoJson.features.map((f) => ({
          label: f.properties["obns_cyr"],
          value: f.obns_num,
        }));

        appendSelectOptions(districtControl._container.querySelector("select"), options);
      }
    } else {
      throw new Error("Unknown layer type: " + layerConfig.type);
    }

    layer.addTo(map);

    layersByName[layerConfig.name] = layer;
  }
}
