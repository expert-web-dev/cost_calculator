declare module 'react-simple-maps' {
  import React from 'react';

  export interface Geography {
    rsmKey: string;
    svgPath: string;
    properties: any;
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: Geography[] }) => React.ReactNode;
  }

  export interface GeographyProps {
    geography: Geography;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onMouseEnter?: (event: React.MouseEvent, geography: Geography) => void;
    onMouseLeave?: (event: React.MouseEvent, geography: Geography) => void;
    onClick?: (event: React.MouseEvent, geography: Geography) => void;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    children?: React.ReactNode;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    style?: React.CSSProperties;
    onClick?: (event: React.MouseEvent) => void;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    children?: React.ReactNode;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void;
    onMove?: (position: { coordinates: [number, number]; zoom: number }) => void;
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    children?: React.ReactNode;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
}

declare module 'd3-geo' {
  export function geoPath(): any;
  export function geoAlbersUsa(): any;
  export function geoMercator(): any;
  export function geoEqualEarth(): any;
}

declare module 'd3-scale' {
  export function scaleLinear(): any;
  export function scaleLinear<Range = any>(): {
    domain: (domain: number[]) => any;
    range: (range: Range[]) => any;
  };
}