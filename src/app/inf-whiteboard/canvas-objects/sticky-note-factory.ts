import {fabric} from 'fabric';
import {FixedSizeTextbox} from "./fixed-size-textbox";
import {CanvasObject} from "../canvas-object";

const STICKY_NOTE_DIMENSIONS = 200;
const STICKY_NOTE_PADDING = 10;
const MAX_FONT_SIZE = 200;
const TEXTBOX_DIMENSIONS = STICKY_NOTE_DIMENSIONS - 2 * STICKY_NOTE_PADDING;

//canvasObject-factory
export class StickyNoteFactory implements CanvasObject<fabric.Group> {
  private canvas!: fabric.Canvas;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  public create(textVisible?: boolean, text?: string, color?: string): fabric.Group {
    const rectangle = this.createRectangle(color);
    const textbox = this.createTextbox(textVisible, text);
    const stickyNote = new fabric.Group([rectangle, textbox]);
    this.createVotingCounter().then(votingCounter => {
      votingCounter.left = 100- votingCounter.width!/2;
      votingCounter.top = 75 + votingCounter.height!/2;
      stickyNote.add(votingCounter);
      this.canvas.renderAll();
    });
    this.setStyle(stickyNote);
    this.attachDoubleClickHandler(stickyNote);
    this.canvas.add(stickyNote);
    stickyNote.viewportCenter();
    return stickyNote;
  }

  private createShadow(): fabric.Shadow {
    return new fabric.Shadow({
      color: 'rgb(0,0,0,0.5)',
      blur: 7,
      offsetX: 1,
      offsetY: 1,
    });
  }

  private createRectangle(color?: string): fabric.Rect {
    return new fabric.Rect({
      left: 0,
      top: 0,
      width: STICKY_NOTE_DIMENSIONS,
      height: STICKY_NOTE_DIMENSIONS,
      fill: color ? color : 'rgb(255, 215, 7)',
      shadow: this.createShadow(),
    });
  }

  private createTextbox(textVisible?: boolean, text?: string): FixedSizeTextbox {
    let textbox = new FixedSizeTextbox('', {
      hasBorders: false,
      textAlign: "center",
      left: STICKY_NOTE_PADDING,
      top: STICKY_NOTE_PADDING,
      fontSize: 21,
      width: TEXTBOX_DIMENSIONS,
      fill: text ? 'transparent' : 'rgb(0,0,0,0.87)',
      fixedHeight: TEXTBOX_DIMENSIONS,
      fixedWidth: TEXTBOX_DIMENSIONS,
      objectCaching: false,
      text: textVisible ? text : "❔",
      hiddenIcon: "❔",
      visibleText: text ? text : ""
    });

    if (text) {
      // Delay execution until rendering is finished
      setTimeout(() => {
        this.adjustFontSize(textbox);
        textbox.fill = 'rgb(0,0,0,0.87)'
        this.canvas.renderAll();
      }, 0);
    }

    textbox.on('changed', () => {
      this.adjustFontSize(textbox);
    });

    return textbox;
  }

  private createVotingCounter(): Promise<fabric.Group> {
    return new Promise((resolve) => {
      let votingCounter = new fabric.Group();
      const counter = new fabric.Text('0', {
        selectable: false,
        fontSize: 19,
        objectCaching: false
      });
      const background = new fabric.Rect({
        fill: "rgb(255,255,255,0.87)",
        rx: 15,
        ry: 100,
        objectCaching: false
      });
      fabric.loadSVGFromURL('/assets/SVG/Thumbs_Up_Icon.svg', (objects, options) => {
        const obj = fabric.util.groupSVGElements(objects, options);
        obj.set({
          scaleX: 0.2,
          scaleY: 0.2,
          left: 5,
          top: 1,
          objectCaching : false
        })
        background.set({
          width: counter.width! + obj.width! * 0.2 + 10,
          height: counter.height! + 5
        })
        counter.set({
          left: obj.width! * 0.2 + 6,
          top: 3
        })
       votingCounter.toObject = (function(toObject) {
          return function(this: fabric.Group) {
            return fabric.util.object.extend(toObject.call(this), {
              name: this.name
            });
          };
        })(fabric.Group.prototype.toObject);
        votingCounter.name = "votingCounter";
        votingCounter.addWithUpdate(background);
        votingCounter.addWithUpdate(obj);
        votingCounter.addWithUpdate(counter);

        // Set the position of the votingCounter at the bottom left of the sticky note.
        votingCounter.set({
          left: 0,
          top: STICKY_NOTE_DIMENSIONS - votingCounter.height!,
          visible: false,
        });

        resolve(votingCounter);
      });
    });
  }

  private setStyle(stickyNote: fabric.Group) {
    stickyNote.setControlsVisibility({
      mb: false,
      ml: false,
      mr: false,
      mt: false
    });

    stickyNote.set({
      borderColor: 'white',
      cornerStrokeColor: 'white',
      lockScalingFlip: true,
    });
  }


  private adjustFontSize(textbox: FixedSizeTextbox) {
    this.adjustFontSizeForHeight(textbox);
    this.adjustFontSizeForWidth(textbox);
    textbox.visibleTextFontSize = textbox.fontSize;
    this.canvas.renderAll();
  }

  private adjustFontSizeForHeight(textbox: FixedSizeTextbox) {
    const stepSize = 10;

    while (this.isTextboxTooSmall(textbox)) {
      this.increaseFontSize(textbox, stepSize);
    }

    while (this.isTextboxTooLarge(textbox)) {
      this.decreaseFontSize(textbox, stepSize);
    }

    // Fine tune the font size, 1 pixel at a time
    while (this.isTextboxTooSmall(textbox)) {
      this.increaseFontSize(textbox, 1);
    }

    while (this.isTextboxTooLarge(textbox)) {
      this.decreaseFontSize(textbox, 1);
    }
  }

  private isTextboxTooSmall(textbox: FixedSizeTextbox): boolean {
    return textbox.height! < STICKY_NOTE_DIMENSIONS - 20 && textbox.fontSize! <= MAX_FONT_SIZE;
  }

  private increaseFontSize(textbox: FixedSizeTextbox, step: number) {
    textbox.fontSize! += step;
    this.canvas.renderAll();
  }

  private isTextboxTooLarge(textbox: FixedSizeTextbox): boolean {
    return textbox.height! > STICKY_NOTE_DIMENSIONS - 20 && textbox.fontSize! >= 1;
  }

  private decreaseFontSize(textbox: FixedSizeTextbox, step: number) {
    textbox.fontSize! -= step;
    this.canvas.renderAll();
  }

  private adjustFontSizeForWidth(textbox: FixedSizeTextbox) {
    if (textbox.width && textbox.fixedWidth && textbox.fontSize) {
      if (textbox.width > textbox.fixedWidth) {
        textbox.fontSize *= textbox.fixedWidth / (textbox.width + 1);
        textbox.width = textbox.fixedWidth;
      }
    }
    this.canvas.renderAll();
  }


  private findGroupContainingTextbox(textbox: FixedSizeTextbox): fabric.Group | undefined {
    const groups = this.canvas.getObjects('group') as fabric.Group[];
    let group = groups.find((group) => group.getObjects().includes(textbox));

    if (!group && textbox.originalGroup) {
      group = textbox.originalGroup;
    }
    return group;
  }

  private deselectGroup() {
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
  }

  private makeObjectsSelectable(group: fabric.Group) {
    const items = group.getObjects();
    items.forEach((item) => item.set({selectable: true}));
  }

  private handleDoubleClick(options: fabric.IEvent<MouseEvent>) {
    let target = options.target as fabric.Group;

    if (target && target.type === 'group') {
      let items = target.getObjects();
      let textbox = items.find((obj) => obj.type === 'textbox') as FixedSizeTextbox;
      if (textbox) {
        textbox.originalGroup = target;
        textbox.clone((clonedObj: FixedSizeTextbox) => {
          let textboxForEdit = clonedObj as FixedSizeTextbox;

          if (textbox.originalGroup) {
            clonedObj.set({
              //TODO padding relative to center for left/top
              left: textbox.originalGroup.left!,
              top: textbox.originalGroup.top!,
              angle: textbox.originalGroup.angle,
              scaleX: textbox.originalGroup.scaleX,
              scaleY: textbox.originalGroup.scaleY,
              hasBorders: false,
              objectCaching: false
            })
            clonedObj.rotate(target.angle!);
            console.log("textboxForEdit", textboxForEdit);

            textboxForEdit.on('changed', () => {
              this.adjustFontSize(textboxForEdit);
            });

            textboxForEdit.on('editing:exited', () => {
              this.handleTextboxEditingExited(textboxForEdit);
              if (textboxForEdit.text) {
                textbox.text = textboxForEdit.text.trim();
                textbox.fire('changed');
              }
            });

            textbox.visible = false;
            this.canvas.add(textboxForEdit);
            this.canvas.requestRenderAll();

            this.canvas.setActiveObject(textboxForEdit);
            textboxForEdit.enterEditing();
            textboxForEdit.originalGroup = target;
            items.forEach((item) => {
              if (item !== textboxForEdit) {
                item.set({selectable: false});
              }
            });
          }
        });
      }
    }
  }


  private handleTextboxEditingExited(textbox: FixedSizeTextbox) {
    const stickyNote = this.findGroupContainingTextbox(textbox);
    if (stickyNote) {
      let items = stickyNote.getObjects();
      items.forEach((item) => {
        console.log("item:", item);
        if (item.type === "textbox" && item instanceof FixedSizeTextbox) {
          item.set({
            text: textbox.text,
            visibleText: textbox.text,
            visible: true
          });
          item.fire('changed');
        }
      });
      this.canvas.remove(textbox);
      this.makeObjectsSelectable(stickyNote);
      this.deselectGroup();
    }
  }

  attachDoubleClickHandler(stickyNote: fabric.Group) {
    stickyNote.on('mousedblclick', this.handleDoubleClick.bind(this));
  }

  public setBackgroundColor(object: fabric.Group, color: string):
    void {
    object.getObjects().forEach(object => {
      if (object.type === 'rect') {
        object.set({fill: color});
      }
    });
    this.canvas.renderAll();
  }
}

