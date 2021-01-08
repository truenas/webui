export class CommonUtils {

	constructor() {
	}

	versionCompare(a, b: any) {
		if (a === b) {
			return 0;
		}

		var a_components = a.split(".");
		var b_components = b.split(".");

		var len = Math.min(a_components.length, b_components.length);

		// loop while the components are equal
		for (var i = 0; i < len; i++) {
			// A bigger than B
			if (parseInt(a_components[i]) > parseInt(b_components[i])) {
				return -1;
			}

			// B bigger than A
			if (parseInt(a_components[i]) < parseInt(b_components[i])) {
				return 1;
			}
		}

		// If one's a prefix of the other, the longer one is greater.
		if (a_components.length > b_components.length) {
			return -1;
		}

		if (a_components.length < b_components.length) {
			return 1;
		}

		// Otherwise they are the same.
		return 0;
	}
  
}
  