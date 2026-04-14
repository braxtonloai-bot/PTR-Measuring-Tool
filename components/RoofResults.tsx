import type { RoofData, GeocodeResult, PropertyValue } from "@/types";
import { formatNumber } from "@/lib/utils";

interface RoofResultsProps {
  address: GeocodeResult;
  roof: RoofData;
  propertyValue?: PropertyValue;
}

export function RoofResults({ address, roof, propertyValue }: RoofResultsProps) {
  // Detect likely inaccurate measurements by comparing roof area to building sq ft.
  // A roof must cover the building footprint, so even for a 2-story home,
  // roof area should be at least ~40% of total living area. Below that = red flag.
  const buildingSqFt = propertyValue?.squareFootage;
  const roofTooBig = buildingSqFt && roof.roofAreaSqFt > buildingSqFt * 1.8;
  const hasDiscrepancy = buildingSqFt
    ? roof.roofAreaSqFt < buildingSqFt * 0.4 || roofTooBig
    : false;

  const measurements = [
    {
      label: "Roof Area",
      value: `${formatNumber(roof.roofAreaSqFt)} sq ft`,
      hero: true,
      colorClass: "text-primary-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      ),
    },
    ...(buildingSqFt
      ? [
          {
            label: "Building Sq Ft",
            value: `${formatNumber(buildingSqFt)} sq ft`,
            hero: false,
            colorClass: "text-blue-500",
            icon: (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            ),
          },
        ]
      : []),
    {
      label: "Roof Facets",
      value: roof.roofFacets.toString(),
      colorClass: "text-violet-500",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      ),
    },
    {
      label: "Predominant Pitch",
      value: roof.predominantPitch,
      colorClass: "text-violet-500",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      ),
    },
    {
      label: "Ridges/Hips",
      value: `${formatNumber(roof.ridgesHipsFt)} ft`,
      colorClass: "text-violet-500",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      label: "Valleys",
      value: `${formatNumber(roof.valleysFt)} ft`,
      colorClass: "text-emerald-500",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      ),
    },
    {
      label: "Rakes",
      value: `${formatNumber(roof.rakesFt)} ft`,
      colorClass: "text-emerald-500",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h7"
        />
      ),
    },
    {
      label: "Eaves",
      value: `${formatNumber(roof.eavesFt)} ft`,
      colorClass: "text-emerald-500",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      ),
    },
    {
      label: "Perimeter",
      value: `${formatNumber(roof.perimeterFt)} ft`,
      colorClass: "text-emerald-500",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
      ),
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="section-header">
        <h2 className="section-title">Roof Measurements</h2>
        <p className="section-subtitle">{address.formattedAddress}</p>
      </div>

      <div className={`mx-6 mt-4 rounded-lg border-2 p-4 ${
        hasDiscrepancy
          ? "border-red-400 bg-red-50"
          : "border-amber-400 bg-amber-50"
      }`}>
        <div className="flex items-center gap-3">
          <svg
            className={`h-7 w-7 flex-shrink-0 ${hasDiscrepancy ? "text-red-600" : "text-amber-600"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span className={`text-lg font-bold uppercase tracking-wide ${
            hasDiscrepancy ? "text-red-700" : "text-amber-700"
          }`}>
            {hasDiscrepancy
              ? "Measurement Discrepancy Detected"
              : "Verify Before Quoting"}
          </span>
        </div>
        <p className={`mt-3 text-sm font-medium leading-relaxed ${
          hasDiscrepancy ? "text-red-800" : "text-amber-800"
        }`}>
          {hasDiscrepancy ? (
            <>
              The roof area ({formatNumber(roof.roofAreaSqFt)} sq ft) appears inconsistent with the
              property size ({formatNumber(buildingSqFt!)} sq ft building).
              The Google Solar API may have failed to detect all roof segments.
              <span className="font-bold"> Do not quote from these measurements</span> — use an independent
              measurement service to get accurate numbers.
            </>
          ) : (
            <>
              These measurements are estimates from Google&apos;s Solar API and frequently
              underestimate actual roof size. <span className="font-bold">Always verify with an independent
              measurement service before quoting.</span>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 p-6 sm:grid-cols-4">
        {measurements.map((item) => (
          <div
            key={item.label}
            className={`stat-card ${item.hero ? "col-span-2 bg-gradient-to-br from-primary-50 to-primary-100/50" : ""}`}
          >
            <div className="flex items-center gap-2">
              <svg
                className={`h-5 w-5 ${item.colorClass}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {item.icon}
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {item.label}
              </span>
            </div>
            <p className={`mt-2 font-display font-bold ${item.hero ? "text-3xl text-primary-800" : "text-xl text-neutral-800"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {roof.segments && roof.segments.length > 0 && (
        <div className="border-t border-neutral-100 px-6 pb-6 pt-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Segment Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Area</th>
                  <th className="pb-2 pr-4">Pitch</th>
                  <th className="pb-2">Facing</th>
                </tr>
              </thead>
              <tbody>
                {roof.segments.map((seg, i) => (
                  <tr key={i} className="border-b border-neutral-50">
                    <td className="py-2 pr-4 text-neutral-500">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium text-neutral-800">
                      {formatNumber(seg.areaSqFt)} sq ft
                    </td>
                    <td className="py-2 pr-4 text-neutral-700">{seg.pitch}</td>
                    <td className="py-2 text-neutral-500">{seg.azimuthDegrees}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
