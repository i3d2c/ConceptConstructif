import Konva from 'konva'

export class CanvasManager {
  stage: Konva.Stage
  layers: {
    background: Konva.Layer
    scale: Konva.Layer
    traces: Konva.Layer
    tool: Konva.Layer
    numbers: Konva.Layer
  }

  constructor(containerId: string, width: number, height: number) {
    this.stage = new Konva.Stage({ container: containerId, width, height })

    this.layers = {
      background: new Konva.Layer(),
      scale: new Konva.Layer(),
      traces: new Konva.Layer(),
      tool: new Konva.Layer(),
      numbers: new Konva.Layer(),
    }

    this.stage.add(this.layers.background)
    this.stage.add(this.layers.scale)
    this.stage.add(this.layers.traces)
    this.stage.add(this.layers.tool)
    this.stage.add(this.layers.numbers)
  }

  resize(width: number, height: number) {
    this.stage.width(width)
    this.stage.height(height)
  }

  destroy() {
    this.stage.destroy()
  }
}
