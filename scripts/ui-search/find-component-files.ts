import glob from 'glob';

export function findComponentFiles(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, (error: Error, files: string[] | PromiseLike<string[]>) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(files);
    });
  });
}
