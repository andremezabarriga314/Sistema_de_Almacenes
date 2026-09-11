// Browser shim for Node.js stream module required by xlsx-js-style
export class Readable {
  static from() { return new Readable(); }
  pipe() { return this; }
  on() { return this; }
  read() { return null; }
}
export class Writable {
  write() { return true; }
  end() {}
  on() { return this; }
}
export class Transform extends Readable {}
export default { Readable, Writable, Transform };
