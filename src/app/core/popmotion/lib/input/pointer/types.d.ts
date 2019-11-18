export declare type PointerPoint = {
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    x: number;
    y: number;
};
export declare type Point2D = {
    x: number;
    y: number;
};
export declare type Point3D = Point2D & {
    z: number;
};
export declare type Point = Point2D | Point3D;
export declare type PointerProps = {
    x?: number;
    y?: number;
    preventDefault?: boolean;
    scale?: number;
    rotate?: number;
};
