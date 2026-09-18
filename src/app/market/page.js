'use client';


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowTrendUp, faArrowTrendDown, faMinus } from "@fortawesome/free-solid-svg-icons";
import { endpoints } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";

const TREND_ICON = { rising: faArrowTrendUp, falling: faArrowTrendDown, stable: faMinus };

export default function Market() {
  const { data, loading } = useFetch(() => endpoints.market(), []);

  return (
    <>
      <PageHeader
        eyebrow="Market Intelligence"
        title="Commodity prices"
        subtitle="Regional prices, demand trends, and seasonal fluctuations to guide selling and crop selection."
      />

      {loading && <div className="loading-text">Loading market data…</div>}

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Commodity</th><th>Region</th><th>Price / kg</th><th>Trend</th><th>Demand</th></tr>
            </thead>
            <tbody>
              {data?.map((m) => {
                const Icon = TREND_ICON[m.trend] || faMinus;
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.commodity}</td>
                    <td className="muted">{m.region}</td>
                    <td className="mono">{m.currency} {m.price_per_kg.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${m.trend}`}>
                        <Icon size={12} /> {m.trend}
                      </span>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{m.demand_level}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
