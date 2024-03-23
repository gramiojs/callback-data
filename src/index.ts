export class CallbackData {
	id: string;

	constructor(id: string) {
		this.id = id;
	}

	pack() {
		return "";
	}

	unpack() {
		return {};
	}
}
