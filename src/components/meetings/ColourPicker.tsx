// app/components/meetings/ColourPicker.tsx
"use client";
import React from 'react';

const presetColours = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

interface ColourPickerProps {
  selectedColour: string;
  onColourChange: (colour: string) => void;
}

export default function ColourPicker({ selectedColour, onColourChange }: ColourPickerProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
        Meeting Colour
      </label>
      
      <div className="flex items-center gap-3 mb-3">
        <input
          type="color"
          value={selectedColour}
          onChange={(e) => onColourChange(e.target.value)}
          className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer dark:border-gray-600"
        />
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
            Selected Colour
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedColour}
          </span>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
          Preset Colours
        </span>
        <div className="flex flex-wrap gap-2">
          {presetColours.map((colour) => (
            <button
              key={colour}
              type="button"
              onClick={() => onColourChange(colour)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColour === colour 
                  ? 'border-gray-800 dark:border-white scale-110' 
                  : 'border-gray-300 dark:border-gray-600 hover:scale-105'
              }`}
              style={{ backgroundColor: colour }}
              title={colour}
            />
          ))}
        </div>
      </div>
    </div>
  );
}