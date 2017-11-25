import { Component } from '@angular/core';
import "reflect-metadata";

export function SubComponent(annotation: any) {
  return function (target: Function) {
    const parentTarget = Object.getPrototypeOf(target.prototype).constructor;
    
    const parentAnnotations = Reflect.getMetadata('annotations', parentTarget);
    
    let parentAnnotation = parentAnnotations[0];
    Object.keys(parentAnnotation).forEach(key => {
      if (parentAnnotation[key]) {
        if (!annotation[key]) {
          annotation[key] = parentAnnotation[key];
        }
      }
    });
    
    const metadata = new Component(annotation);

    Reflect.defineMetadata('annotations', [ metadata ], target);
  };
};
