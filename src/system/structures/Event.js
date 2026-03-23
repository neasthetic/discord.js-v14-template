class Event {
  /**
   * @param {{event: string, once?: boolean, run: Function}} structure
   */
  constructor(structure) {
    this.data = {
      once: false,
      ...structure,
    };
  }

  toJSON() {
    return { ...this.data };
  }
}

module.exports = Event;
