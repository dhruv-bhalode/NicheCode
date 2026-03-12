import React from 'react';

interface Skill {
    name: string;
    level: number;
}

interface RadarChartProps {
    skills: Skill[];
    colors: string[];
    size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ skills, colors, size = 300 }) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = size / 2 - 60; // Leave space for labels
    const numSides = 10;
    const angleStep = (2 * Math.PI) / numSides;

    // Calculate points for each skill level
    const getPoint = (index: number, value: number) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const radius = (value / 100) * maxRadius;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        };
    };


    // Generate polygon points for skill data
    const dataPoints = skills.slice(0, numSides).map((skill, i) => getPoint(i, skill.level));
    const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    // Generate label positions (just above percentage labels)
    // Label calculations removed

    // Generate percentage label positions (radially close to data points)
    const percentLabels = skills.slice(0, numSides).map((skill, i) => {
        const angle = i * angleStep - Math.PI / 2;
        // Position percentage label radially just outside the data point
        const dataPointRadius = (skill.level / 100) * maxRadius;
        const labelRadius = dataPointRadius + 25; // 25px outside the data point
        const labelX = centerX + labelRadius * Math.cos(angle);
        const labelY = centerY + labelRadius * Math.sin(angle);
        return {
            x: labelX,
            y: labelY,
            level: skill.level,
            color: colors[i % colors.length],
        };
    });

    // Calculate bounding box dynammically based on content
    // Simplified bounding box
    const minX = 0;
    const maxX = size;
    const minY = 0;
    const maxY = size;

    const viewBoxWidth = maxX - minX;
    const viewBoxHeight = maxY - minY;

    // State for tooltip
    const [hoveredData, setHoveredData] = React.useState<{ name: string, value: number, x: number, y: number } | null>(null);

    return (
        <div className="flex items-center justify-center relative">
            <svg
                viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
                width={viewBoxWidth}
                height={viewBoxHeight}
                className="overflow-visible"
                style={{ maxWidth: '100%', height: 'auto' }}
            >
                {/* Data polygon - create gradient effect with multiple colored segments */}
                <defs>
                    <radialGradient id="radarGradient" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
                        <stop offset="100%" stopColor="rgba(139, 92, 246, 0.05)" />
                    </radialGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Main polygon with gradient */}
                <polygon
                    points={polygonPoints}
                    fill="url(#radarGradient)"
                    stroke="none"
                    strokeWidth="0"
                />

                {/* Individual colored segments from center to each point */}
                {dataPoints.map((point, i) => {
                    const nextPoint = dataPoints[(i + 1) % dataPoints.length];
                    const color = colors[i % colors.length];
                    return (
                        <path
                            key={`segment-${i}`}
                            d={`M ${centerX} ${centerY} L ${point.x} ${point.y} L ${nextPoint.x} ${nextPoint.y} Z`}
                            fill={color.replace('rgb', 'rgba').replace(')', ', 0.4)')}
                            stroke="none"
                        />
                    );
                })}

                {/* Data points with Hover */}
                {dataPoints.map((point, i) => (
                    <circle
                        key={i}
                        cx={point.x}
                        cy={point.y}
                        r={hoveredData?.name === skills[i].name ? 6 : 3}
                        fill={colors[i % colors.length]}
                        className="drop-shadow-lg cursor-pointer transition-all duration-300 ease-out"
                        stroke="white"
                        strokeWidth={hoveredData?.name === skills[i].name ? 2 : 0}
                        onMouseEnter={() => setHoveredData({ name: skills[i].name, value: skills[i].level, x: point.x, y: point.y })}
                        onMouseLeave={() => setHoveredData(null)}
                    />
                ))}

                {/* Labels Removed */}

                {/* Percentage labels near data points (Optional: Fade them out on hover?) */}
                {percentLabels.map((label, i) => (
                    <text
                        key={`percent-${i}`}
                        x={label.x}
                        y={label.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[11px] font-bold"
                        fill={label.color}
                        opacity={hoveredData ? 0.3 : 1} // Fade out when hovering to focus on tooltip
                    >
                        {Math.round(label.level)}%
                    </text>
                ))}

                {/* Tooltip in SVG */}
                {hoveredData && (
                    <g transform={`translate(${hoveredData.x}, ${hoveredData.y - 15})`} style={{ pointerEvents: 'none' }}>
                        <rect
                            x="-50"
                            y="-35"
                            width="100"
                            height="30"
                            rx="6"
                            fill="rgba(24, 24, 27, 0.9)"
                            stroke="rgba(255, 255, 255, 0.1)"
                        />
                        <text
                            x="0"
                            y="-16"
                            textAnchor="middle"
                            fill="white"
                            fontSize="11"
                            fontWeight="bold"
                        >
                            {hoveredData.name}: {Math.round(hoveredData.value)}%
                        </text>
                        {/* Little triangle pointer */}
                        <path d="M -5 -5 L 0 0 L 5 -5 Z" fill="rgba(24, 24, 27, 0.9)" transform="translate(0, -1)" />
                    </g>
                )}
            </svg>
        </div>
    );
};

export default RadarChart;
