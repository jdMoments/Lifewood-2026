import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Feature, FeatureCollection, Geometry } from 'geojson';

const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const LIFEWOOD_COUNTRIES = [
  'United States of America', 'Canada', 'Brazil', 'United Kingdom', 'Germany', 'France', 
  'India', 'China', 'Japan', 'Australia', 'South Africa', 'Nigeria', 'Mexico', 'Argentina',
  'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Russia', 'South Korea', 'Indonesia',
  'Thailand', 'Vietnam', 'Philippines', 'Malaysia', 'Singapore', 'New Zealand', 'Egypt', 'Kenya'
];

const InteractiveMap: React.FC = () => {
  const [geographies, setGeographies] = useState<Array<Feature<Geometry, any>>>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    d3.json(WORLD_ATLAS_URL).then((data: any) => {
      const countries = topojson.feature(data, data.objects.countries) as unknown as FeatureCollection;
      // Sort countries by name for the list
      const sortedFeatures = countries.features.sort((a: any, b: any) => 
        (a.properties?.name || '').localeCompare(b.properties?.name || '')
      );
      setGeographies(sortedFeatures);
    });
  }, []);

  const projection = useMemo(() => {
    return d3.geoMercator()
      .scale(120)
      .translate([dimensions.width / 2, dimensions.height / 1.4]);
  }, [dimensions]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current || geographies.length === 0) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    // Draw countries
    g.selectAll('.country')
      .data(geographies)
      .join('path')
      .attr('class', 'country cursor-pointer transition-colors duration-300')
      .attr('d', pathGenerator as any)
      .attr('fill', (d: any) => {
        const countryName = d.properties?.name;
        if (countryName === selectedCountry) return '#FFB347'; // Highlight color
        return LIFEWOOD_COUNTRIES.includes(countryName) ? '#1a3a3a' : '#cbd5e1';
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.5)
      .on('click', (event, d: any) => {
        setSelectedCountry(d.properties?.name);
      });

    // Zoom logic
    if (selectedCountry) {
      const feature = geographies.find(d => d.properties?.name === selectedCountry);
      if (feature) {
        const bounds = pathGenerator.bounds(feature as any);
        const dx = bounds[1][0] - bounds[0][0];
        const dy = bounds[1][1] - bounds[0][1];
        const x = (bounds[0][0] + bounds[1][0]) / 2;
        const y = (bounds[0][1] + bounds[1][1]) / 2;
        const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / dimensions.width, dy / dimensions.height)));
        const translate = [dimensions.width / 2 - scale * x, dimensions.height / 2 - scale * y];

        svg.transition()
          .duration(750)
          .call(
            (transition: any) => transition.select('g').attr('transform', `translate(${translate})scale(${scale})`)
          );
      }
    } else {
      svg.transition()
        .duration(750)
        .call(
          (transition: any) => transition.select('g').attr('transform', 'translate(0,0)scale(1)')
        );
    }

  }, [geographies, selectedCountry, dimensions, pathGenerator]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-[#e0f2f1] overflow-hidden">
      {/* Country List Sidebar */}
      <div className="w-full md:w-64 bg-white/50 backdrop-blur-sm border-r border-gray-200 flex flex-col h-[200px] md:h-full">
        <div className="p-4 border-bottom border-gray-100 bg-white/80">
          <h3 className="text-sm font-bold text-[#1a3a3a] uppercase tracking-wider">Global Reach</h3>
          <p className="text-xs text-gray-500 mt-1">{geographies.length} Countries Mapped</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <ul className="py-2">
            <li>
              <button
                onClick={() => setSelectedCountry(null)}
                className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${!selectedCountry ? 'bg-[#FFB347] text-white' : 'text-gray-600 hover:bg-white/60'}`}
              >
                Reset View
              </button>
            </li>
            {geographies.map((d: any) => {
              const name = d.properties?.name;
              const isActive = LIFEWOOD_COUNTRIES.includes(name);
              return (
                <li key={name}>
                  <button
                    onClick={() => setSelectedCountry(name)}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between ${selectedCountry === name ? 'bg-[#1a3a3a] text-white' : 'text-gray-700 hover:bg-white/80'}`}
                  >
                    <span className={isActive ? 'font-semibold' : ''}>{name}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FFB347]"></span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-[#e0f2f1]">
        <svg 
          ref={svgRef} 
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="w-full h-full"
        >
          <g ref={gRef} />
        </svg>
        
        {/* Floating Tooltip/Info */}
        {selectedCountry && (
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-lg font-bold text-[#1a3a3a]">{selectedCountry}</h4>
            <p className="text-xs text-gray-500">
              {LIFEWOOD_COUNTRIES.includes(selectedCountry) 
                ? 'Active Lifewood Operations Center' 
                : 'Regional Data Collection Node'}
            </p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default InteractiveMap;
