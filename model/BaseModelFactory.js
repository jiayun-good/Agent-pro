// BaseModelFactory.js
// 创建一个基础工厂类
class BaseModelFactory {
  constructor() {
      if (this.constructor === BaseModelFactory) {
          throw new Error("Cannot instantiate abstract class BaseModelFactory");
      }
  }

  generator() {
      throw new Error("Method 'generator()' must be implemented.");
  }
}