import React from 'react';
import { BatchItem } from '../types';
import { BoardPreview } from './BoardPreview';

interface TiledPreviewProps {
  batchData: BatchItem[];
  tileWidthCm: number;
  numCols: number;
}

export const TiledPreview: React.FC<TiledPreviewProps> = ({ batchData, tileWidthCm, numCols }) => {
  const totalCopies = batchData.reduce((sum, item) => sum + item.copies, 0);

  const normalizeToCm = (val: number, unit: string) => {
    if (unit === 'cm') return val;
    if (unit === 'mm') return val / 10;
    if (unit === 'in') return val * 2.54;
    return val;
  };
  
  // Create a flattened list of boards based on copies
  const flattenedBoards: BatchItem[] = [];
  batchData.forEach(item => {
    for (let i = 0; i < item.copies; i++) {
      flattenedBoards.push(item);
    }
  });

  // Group into rows and calculate per-row max width
  const rows: { boards: BatchItem[], maxBoardWidth: number }[] = [];
  for (let i = 0; i < flattenedBoards.length; i += numCols) {
    const rowBoards = flattenedBoards.slice(i, i + numCols);
    const maxW = Math.max(...rowBoards.map(d => normalizeToCm(d.width, d.unit)));
    rows.push({ boards: rowBoards, maxBoardWidth: maxW });
  }

  const totalTileHeightCm = rows.reduce((sum, row) => sum + row.maxBoardWidth, 0);

  // We'll use a fixed scale for preview pixels
  const pxPerCm = 2; // 1cm = 2px for preview

  return (
    <div className="w-full bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-inner flex flex-col">
      <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-800/30 flex justify-between items-center">
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Layout Preview</span>
        <span className="text-[10px] font-medium text-neutral-400">{tileWidthCm}cm x {totalTileHeightCm}cm</span>
      </div>
      
      <div className="p-4 overflow-auto max-h-[400px] custom-scrollbar bg-neutral-950/50">
        <div 
          className="relative mx-auto bg-white shadow-2xl transition-all duration-500"
          style={{
            width: `${tileWidthCm * pxPerCm}px`,
            height: `${totalTileHeightCm * pxPerCm}px`,
            minHeight: '100px'
          }}
        >
          {(() => {
            let cumulativeHeightCm = 0;
            return rows.map((row, rowIndex) => {
              const rowTop = cumulativeHeightCm;
              cumulativeHeightCm += row.maxBoardWidth;
              
              return row.boards.map((board, colIdx) => {
                const boardHeightCm = normalizeToCm(board.height, board.unit);
                const boardWidthCm = normalizeToCm(board.width, board.unit);
                
                let posXCm = 0;
                const totalGaps = numCols - 1;
                const totalBoardsWidth = numCols * boardHeightCm;
                const gapSize = Math.max(0, (tileWidthCm - totalBoardsWidth) / totalGaps);
                posXCm = colIdx * (boardHeightCm + gapSize);

                return (
                  <div 
                    key={`${rowIndex}-${colIdx}`}
                    className="absolute border border-black overflow-hidden"
                    style={{
                      left: `${posXCm * pxPerCm}px`,
                      top: `${rowTop * pxPerCm}px`,
                      width: `${boardHeightCm * pxPerCm}px`,
                      height: `${boardWidthCm * pxPerCm}px`,
                      backgroundColor: board.backgroundColor,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div 
                      className="w-full h-full"
                      style={{ 
                        transform: 'rotate(90deg)', 
                        transformOrigin: 'center',
                        width: `${boardWidthCm * pxPerCm}px`,
                        height: `${boardHeightCm * pxPerCm}px`,
                        position: 'absolute',
                        left: `${(boardHeightCm - boardWidthCm) / 2 * pxPerCm}px`,
                        top: `${(boardWidthCm - boardHeightCm) / 2 * pxPerCm}px`,
                      }}
                    >
                      <BoardPreview config={board} dpi={pxPerCm * 2.54} /> {/* Correct DPI for 1cm = 2px preview scale */}
                    </div>
                  </div>
                );
              });
            });
          })()}
        </div>
      </div>
      
      <div className="px-4 py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-medium text-center border-t border-indigo-500/20">
        Showing arrangement for {totalCopies} boards • {rows.length} rows
      </div>
    </div>
  );
};
