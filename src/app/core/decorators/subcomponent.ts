import { Component } from '@angular/core';
import "reflect-metadata";

export function SubComponent(annotation: any) {
  return function (target: Function) {
    var parentTarget = Object.getPrototypeOf(target.prototype).constructor;
    
    var parentAnnotations = Reflect.getMetadata('annotations', parentTarget);
    
    var parentAnnotation = parentAnnotations[0];
    Object.keys(parentAnnotation).forEach(key => {
      if (parentAnnotation[key]) {
        if (!annotation[key]) {
          annotation[key] = parentAnnotation[key];
        }
      }
    });
    
    var metadata = new Component(annotation);

    Reflect.defineMetadata('annotations', [ metadata ], target);
  };
};
