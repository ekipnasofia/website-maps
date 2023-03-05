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

export default async function init(config) {
  const map = L.map("map").fitBounds(config.mapBounds);
  const legend = L.control({ position: config.legend.position });

  for (const layerConfig of config.layers) {
    let layer = null;

    if (layerConfig.type === "tilelayer") {
      layer = L.tileLayer(layerConfig.source, layerConfig.options);
    } else if (layerConfig.type === "geojson") {
      const geoJson = await fetch(layerConfig.source).then((resp) =>
        resp.json()
      );
      layer = L.geoJSON(geoJson, layerConfig.options);

      if (layerConfig.styleProperty) {
        layer.setStyle(legendStyle(config, layerConfig));
      }

      if (layerConfig.popupTmpl) {
        layer.bindPopup((event) =>
          Mustache.render(layerConfig.popupTmpl, { f: event.feature })
        );
      }
    } else {
      throw new Error("Unknown layer type: " + layerConfig.type);
    }

    layer.addTo(map);
  }

  legend.onAdd = function (map) {
    const div = L.DomUtil.create("div", "legend");
    const labels = [];

    labels.push(`<h4 class="header">${config.legend.header}</h4>`);
    labels.push(
      `<ul class="legend-items" style="font-family: ${config.legend.fontFamily};">`
    );

    for (const legendItem of config.legend.items) {
      labels.push(`
        <li class="legend-item">
          <i class="symbol ${legendItem.symbol}" style="background-color: ${legendItem.style.fillColor};"></i>
          ${legendItem.label}
        </li>
    `);
    }

    labels.push(`</ul>`);

    div.innerHTML = labels.join("");

    return div;
  };
  legend.addTo(map);
}
