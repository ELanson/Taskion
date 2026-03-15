import React, { forwardRef } from 'react';
import { BoardConfig } from '../types';
import { unitToPx } from '../utils';

interface BoardPreviewProps {
  config: BoardConfig;
  dpi?: number;
}

export const BoardPreview = forwardRef<SVGSVGElement, BoardPreviewProps>(
  ({ config, dpi = 300 }, ref) => {
    const {
      width,
      height,
      unit,
      bleed,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      text,
      fontSize,
      fontFamily,
      fontWeight,
      backgroundColor,
      textColor,
      showGuides,
      layout = 'text-only',
      textAlign = 'center',
      verticalAlign = 'center',
      logoSize = 5,
    } = config;

    const wPx = unitToPx(width, unit, dpi);
    const hPx = unitToPx(height, unit, dpi);
    const bleedPx = unitToPx(bleed, unit, dpi);
    
    // Calculate margins based on layout
    const isWithLogos = layout === 'with-logos';
    const logoWidthPx = unitToPx(logoSize, 'cm', dpi);
    const logoMarginPx = unitToPx(2, 'cm', dpi); // Fixed small distance from bleed edge
    const logoTopPx = unitToPx(height / 10, 'cm', dpi); // Proportional top/bottom margin for logo
    const logoHeightPx = Math.max(0, hPx - logoTopPx * 2);
    
    // Content margins (where the text goes) should be at least logoSize + some gap
    const logoSafeMarginPx = unitToPx(logoSize + 4, 'cm', dpi);
    const effectiveMarginLeftPx = isWithLogos ? logoSafeMarginPx : unitToPx(marginLeft, unit, dpi);
    const effectiveMarginRightPx = isWithLogos ? logoSafeMarginPx : unitToPx(marginRight, unit, dpi);
    const effectiveMarginTopPx = unitToPx(marginTop, unit, dpi);
    const effectiveMarginBottomPx = unitToPx(marginBottom, unit, dpi);

    const totalWPx = wPx + bleedPx * 2;
    const totalHPx = hPx + bleedPx * 2;
    
    const textWidthPx = wPx - effectiveMarginLeftPx - effectiveMarginRightPx;
    const textHeightPx = hPx - effectiveMarginTopPx - effectiveMarginBottomPx;

    return (
      <svg
        ref={ref}
        width="100%"
        height="100%"
        viewBox={`0 0 ${totalWPx} ${totalHPx}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          maxHeight: '100%',
          maxWidth: '100%',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        }}
      >
        {/* Background including bleed */}
        <rect
          x={0}
          y={0}
          width={totalWPx}
          height={totalHPx}
          fill={backgroundColor}
        />

        {/* Logos placeholders */}
        {isWithLogos && (
          <>
            {config.leftLogo ? (
              <image
                href={config.leftLogo.url}
                x={bleedPx + logoMarginPx}
                y={bleedPx + logoTopPx}
                width={logoWidthPx}
                height={logoHeightPx}
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <>
                <rect
                  x={bleedPx + logoMarginPx}
                  y={bleedPx + logoTopPx}
                  width={logoWidthPx}
                  height={logoHeightPx}
                  fill="rgba(0, 0, 0, 0.05)"
                  stroke="rgba(0, 0, 0, 0.2)"
                  strokeDasharray="4,4"
                  rx={unitToPx(0.5, 'cm', dpi)}
                />
                <text
                  x={bleedPx + logoMarginPx + logoWidthPx / 2}
                  y={bleedPx + logoTopPx + logoHeightPx / 2}
                  fill="rgba(0, 0, 0, 0.3)"
                  fontSize={unitToPx(1, 'cm', dpi)}
                  fontFamily={fontFamily}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  LOGO
                </text>
              </>
            )}

            {config.rightLogo ? (
              <image
                href={config.rightLogo.url}
                x={bleedPx + wPx - logoMarginPx - logoWidthPx}
                y={bleedPx + logoTopPx}
                width={logoWidthPx}
                height={logoHeightPx}
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <>
                <rect
                  x={bleedPx + wPx - logoMarginPx - logoWidthPx}
                  y={bleedPx + logoTopPx}
                  width={logoWidthPx}
                  height={logoHeightPx}
                  fill="rgba(0, 0, 0, 0.05)"
                  stroke="rgba(0, 0, 0, 0.2)"
                  strokeDasharray="4,4"
                  rx={unitToPx(0.5, 'cm', dpi)}
                />
                <text
                  x={bleedPx + wPx - logoMarginPx - logoWidthPx / 2}
                  y={bleedPx + logoTopPx + logoHeightPx / 2}
                  fill="rgba(0, 0, 0, 0.3)"
                  fontSize={unitToPx(1, 'cm', dpi)}
                  fontFamily={fontFamily}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  LOGO
                </text>
              </>
            )}
          </>
        )}

        {/* Text */}
        {(() => {
          const targetFontSizePx = fontSize * (dpi / 72);
          let minFontSize = 1;
          let maxFontSize = targetFontSizePx;
          let currentFontSize = targetFontSizePx;
          let lines: string[] = [];
          let totalTextHeight = 0;
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
            for (let i = 0; i < 20; i++) {
              currentFontSize = (minFontSize + maxFontSize) / 2;
              const fontStr = `${fontWeight} ${currentFontSize}px ${fontFamily}`;
              context.font = fontStr;
              
              lines = [];
              const paragraphs = text.split('\n');
              let maxLineWidth = 0;
              
              for (const paragraph of paragraphs) {
                const words = paragraph.split(' ');
                let currentLine = words[0] || '';
                
                for (let j = 1; j < words.length; j++) {
                  const word = words[j];
                  const width = context.measureText(currentLine + ' ' + word).width;
                  if (width <= textWidthPx) {
                    currentLine += ' ' + word;
                  } else {
                    lines.push(currentLine);
                    const lw = context.measureText(currentLine).width;
                    if (lw > maxLineWidth) maxLineWidth = lw;
                    currentLine = word;
                  }
                }
                lines.push(currentLine);
                const lw = context.measureText(currentLine).width;
                if (lw > maxLineWidth) maxLineWidth = lw;
              }
              
              const lineHeight = currentFontSize * 1.2;
              totalTextHeight = lines.length * lineHeight;
              
              if (totalTextHeight > textHeightPx || maxLineWidth > textWidthPx) {
                maxFontSize = currentFontSize;
              } else {
                minFontSize = currentFontSize;
              }
            }
            
            currentFontSize = minFontSize;
            const fontStr = `${fontWeight} ${currentFontSize}px ${fontFamily}`;
            context.font = fontStr;
            lines = [];
            const paragraphs = text.split('\n');
            for (const paragraph of paragraphs) {
              const words = paragraph.split(' ');
              let currentLine = words[0] || '';
              for (let j = 1; j < words.length; j++) {
                const word = words[j];
                const width = context.measureText(currentLine + ' ' + word).width;
                if (width <= textWidthPx) {
                  currentLine += ' ' + word;
                } else {
                  lines.push(currentLine);
                  currentLine = word;
                }
              }
              lines.push(currentLine);
            }
            totalTextHeight = lines.length * (currentFontSize * 1.2);
          } else {
            lines = [text];
            totalTextHeight = currentFontSize * 1.2;
          }

          let startY = bleedPx + effectiveMarginTopPx + currentFontSize;
          if (verticalAlign === 'center') {
            startY = bleedPx + effectiveMarginTopPx + (textHeightPx - totalTextHeight) / 2 + currentFontSize;
          } else if (verticalAlign === 'bottom') {
            startY = bleedPx + effectiveMarginTopPx + textHeightPx - totalTextHeight + currentFontSize;
          }
          let startX = bleedPx + effectiveMarginLeftPx;
          let textAnchor = 'start';
          
          if (textAlign === 'center') {
            startX += textWidthPx / 2;
            textAnchor = 'middle';
          } else if (textAlign === 'right') {
            startX += textWidthPx;
            textAnchor = 'end';
          }

          return (
            <text
              x={startX}
              y={startY}
              fill={textColor}
              fontSize={`${currentFontSize}px`}
              fontFamily={fontFamily}
              fontWeight={fontWeight}
              textAnchor={textAnchor}
              dominantBaseline="baseline"
            >
              {lines.map((line, i) => (
                <tspan
                  key={i}
                  x={startX}
                  dy={i === 0 ? 0 : currentFontSize * 1.2}
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })()}

        {/* Guides */}
        {showGuides && (
          <>
            {/* Bleed guide (red dashed) */}
            <rect
              x={0}
              y={0}
              width={totalWPx}
              height={totalHPx}
              fill="none"
              stroke="red"
              strokeWidth={unitToPx(0.5, 'mm', dpi)}
              strokeDasharray={`${unitToPx(2, 'mm', dpi)},${unitToPx(2, 'mm', dpi)}`}
            />

            {/* Trim edge (solid border) */}
            <rect
              x={bleedPx}
              y={bleedPx}
              width={wPx}
              height={hPx}
              fill="none"
              stroke="black"
              strokeWidth={unitToPx(0.5, 'mm', dpi)}
            />

            {/* Margin guide (blue dashed) */}
            <rect
              x={bleedPx + effectiveMarginLeftPx}
              y={bleedPx + effectiveMarginTopPx}
              width={textWidthPx}
              height={textHeightPx}
              fill="none"
              stroke="blue"
              strokeWidth={unitToPx(0.5, 'mm', dpi)}
              strokeDasharray={`${unitToPx(2, 'mm', dpi)},${unitToPx(2, 'mm', dpi)}`}
            />
          </>
        )}
      </svg>
    );
  }
);

BoardPreview.displayName = 'BoardPreview';
