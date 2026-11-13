import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';

import type { ReorderActivity as ReorderData } from '../types.d.ts';

interface ReorderActivityProps {
  activity: ReorderData;
  order: Array<number>;
  confirmed: boolean;
  onMove: (from: number, to: number) => void;
}

export function ReorderActivity({
  activity,
  order,
  confirmed,
  onMove,
}: ReorderActivityProps): JSX.Element {
  const dragged = useRef<number | null>(null);

  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-xl font-bold">{activity.title}</h2>
      <ul class="flex flex-col gap-2">
        {order.map((elementIndex, position) => {
          const element = activity.elements[elementIndex];
          if (element === undefined) return null;

          const correctPosition = confirmed ? activity.elements.indexOf(element) + 1 : 0;
          const isRightPosition = confirmed ? correctPosition === position + 1 : false;

          return (
            <li
              key={elementIndex}
              data-testid="reorder-item"
              draggable={!confirmed}
              class="cursor-grab rounded-box border border-base-300 bg-base-100 p-3 shadow-sm"
              onDragStart={() => {
                dragged.current = position;
              }}
              onDragOver={event => {
                event.preventDefault();
              }}
              onDrop={event => {
                event.preventDefault();
                if (dragged.current !== null) {
                  onMove(dragged.current, position);
                  dragged.current = null;
                }
              }}>
              {confirmed && (
                <span
                  class={`text-2xl font-bold mr-3 ${isRightPosition ? 'text-success' : 'text-error'}`}>
                  {correctPosition}
                </span>
              )}
              {element}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
