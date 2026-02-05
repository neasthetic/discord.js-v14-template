class Event {
  /**
   * @param {{event: string, once?: boolean, run: Function}} structure
   */
  constructor(structure) {
    this.data = {
      __type__: 5,
      once: false,
      ...structure,
    };
  }

  toJSON() {
    return { ...this.data };
  }
}

module.exports = Event;