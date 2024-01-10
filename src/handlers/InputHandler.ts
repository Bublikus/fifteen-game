type InputHandlerActions = Partial<
  TouchGestureHandlerActions & DesktopInputHandlerActions
>;

type InputHandlerConfig = TouchGestureHandlerConfig & DesktopInputHandlerConfig;

export class InputHandler {
  private touchHandler: TouchGestureHandler | undefined;
  private desktopHandler: DesktopInputHandler | undefined;

  constructor(config?: InputHandlerConfig) {
    if (this.isTouch) {
      this.touchHandler = new TouchGestureHandler(config);
    } else {
      this.desktopHandler = new DesktopInputHandler(config);
    }
  }

  get isTouch(): boolean {
    return Boolean("ontouchstart" in window || navigator.maxTouchPoints);
  }

  public handleActions(actions: InputHandlerActions): InputHandler {
    this.touchHandler?.handleActions(actions);
    this.desktopHandler?.handleActions(actions);
    return this;
  }

  public destroy() {
    this.touchHandler?.destroy();
    this.desktopHandler?.destroy();
  }
}

// Mobile

type TouchActionKeys =
  | "tap"
  | "doubleTap"
  | "longTap"
  | "swipeUp"
  | "swipeDown"
  | "swipeLeft"
  | "swipeRight"
  | "touchstart"
  | "touchmove"
  | "touchend";

export type TouchGestureHandlerActions = Partial<
  Record<TouchActionKeys, (e: TouchEvent) => void>
>;

type TouchGestureHandlerConfig = {
  el?: HTMLElement | Document;
  swipeTickThresholdPX?: number;
};

export class TouchGestureHandler {
  private element: HTMLElement | Document;
  private actions: TouchGestureHandlerActions = {};
  private longClickDuration: number;
  private singleClickTimeout?: ReturnType<typeof setTimeout>;
  private doubleClickDuration: number;
  private touchStartX: number;
  private touchStartY: number;
  private swipeStartX: number;
  private swipeStartY: number;
  private touchStartTime: number;
  private lastTapTime: number = 0;
  private isSwiping: boolean;
  private swipeTickThresholdPX: number;

  constructor(config: TouchGestureHandlerConfig = {}) {
    this.element = config.el ?? document;
    this.longClickDuration = 500;
    this.doubleClickDuration = 200;
    this.swipeTickThresholdPX = config.swipeTickThresholdPX ?? 50;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.swipeStartX = 0;
    this.swipeStartY = 0;
    this.touchStartTime = 0;
    this.isSwiping = false;

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  public handleActions(actions: TouchGestureHandlerActions) {
    this.actions = actions;
    // @ts-ignore
    this.element.addEventListener("touchstart", this.handleTouchStart, false);
    // @ts-ignore
    this.element.addEventListener("touchmove", this.handleTouchMove, false);
    // @ts-ignore
    this.element.addEventListener("touchend", this.handleTouchEnd, false);
  }

  private handleTouchStart(event: TouchEvent) {
    this.actions["touchstart"]?.(event);
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.swipeStartX = event.touches[0].clientX;
    this.swipeStartY = event.touches[0].clientY;
    this.touchStartTime = Date.now();
    this.isSwiping = false;
  }

  private handleTouchMove(event: TouchEvent) {
    this.actions["touchmove"]?.(event);

    if (!this.swipeTickThresholdPX && this.isSwiping) return;

    const touchMoveX = event.touches[0].clientX;
    const touchMoveY = event.touches[0].clientY;

    const isSwiping =
      Math.abs(touchMoveX - this.swipeStartX) >
        (this.isSwiping ? this.swipeTickThresholdPX : 20) ||
      Math.abs(touchMoveY - this.swipeStartY) >
        (this.isSwiping ? this.swipeTickThresholdPX : 20);

    if (isSwiping) {
      this.isSwiping = true;

      const swipeDirection = this.getSwipeDirection(
        this.swipeStartX,
        this.swipeStartY,
        touchMoveX,
        touchMoveY
      );

      this.swipeStartX = touchMoveX;
      this.swipeStartY = touchMoveY;

      this.actions[swipeDirection]?.(event);
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    this.actions["touchend"]?.(event);

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const touchDuration = Date.now() - this.touchStartTime;
    const timeSinceLastTap = Date.now() - this.lastTapTime;
    const isDoubleTapHandler = typeof this.actions.doubleTap === "function";
    const isHold =
      Math.abs(touchEndX - this.touchStartX) < 10 &&
      Math.abs(touchEndY - this.touchStartY) < 10;

    this.lastTapTime = Date.now();

    if (
      isDoubleTapHandler &&
      timeSinceLastTap <= this.doubleClickDuration &&
      isHold
    ) {
      clearTimeout(this.singleClickTimeout);
      this.actions.doubleTap?.(event);
      return;
    }

    if (touchDuration < this.longClickDuration && !this.isSwiping) {
      if (!isDoubleTapHandler) {
        this.actions.tap?.(event);
      } else {
        this.singleClickTimeout = setTimeout(() => {
          if (isHold) {
            this.actions.tap?.(event);
          }
        }, this.doubleClickDuration + 50);
      }
    } else if (!this.isSwiping) {
      this.actions.longTap?.(event);
    }
  }

  private getSwipeDirection(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): TouchActionKeys {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? "swipeRight" : "swipeLeft";
    } else {
      return deltaY > 0 ? "swipeDown" : "swipeUp";
    }
  }

  public destroy() {
    clearTimeout(this.singleClickTimeout);
    this.element.removeEventListener(
      "touchstart",
      // @ts-ignore
      this.handleTouchStart,
      false
    );
    // @ts-ignore
    this.element.removeEventListener("touchmove", this.handleTouchMove, false);
    // @ts-ignore
    this.element.removeEventListener("touchend", this.handleTouchEnd, false);
  }
}

// Desktop

type DesktopActionKeys =
  | "click"
  | "longClick"
  | "doubleClick"
  | "rightClick"
  | "middleClick"
  | "scrollUp"
  | "scrollDown"
  | "scrollLeft"
  | "scrollRight"
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Space"
  | "Enter"
  | "Escape"
  | "Tab";

export type DesktopInputHandlerActions = Partial<
  Record<DesktopActionKeys, (e: KeyboardEvent | MouseEvent) => void>
>;

type DesktopInputHandlerConfig = {
  el?: HTMLElement | Document;
  fireKeyHoldPerFrame?: boolean;
};

export class DesktopInputHandler {
  private element: HTMLElement | Document;
  private actions: DesktopInputHandlerActions = {};
  private shouldFireKeyHoldPerFrame: boolean;
  private longClickDuration: number;
  private doubleClickDuration: number;
  private longClickTimeout?: number;
  private lastClickTime: number;
  private lastScrollTop: number = 0;
  private lastScrollLeft: number = 0;
  private heldKeys: Set<string> = new Set();
  private animationFrameRequest: number | undefined;

  constructor(config: DesktopInputHandlerConfig = {}) {
    this.element = config.el ?? document;
    this.shouldFireKeyHoldPerFrame = config.fireKeyHoldPerFrame ?? false;
    this.longClickDuration = 500;
    this.doubleClickDuration = 200;
    this.lastClickTime = 0;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseEvents = this.handleMouseEvents.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleKeyHold = this.handleKeyHold.bind(this);

    // @ts-ignore
    this.element.addEventListener("keydown", this.handleKeyDown);
    // @ts-ignore
    this.element.addEventListener("keyup", this.handleKeyUp);
    // @ts-ignore
    this.element.addEventListener("mousedown", this.handleMouseEvents);
    // @ts-ignore
    this.element.addEventListener("mouseup", this.handleMouseEvents);
    // @ts-ignore
    this.element.addEventListener("scroll", this.handleScroll);

    if (this.shouldFireKeyHoldPerFrame) {
      // Start the animation loop
      this.animationFrameRequest = requestAnimationFrame(this.handleKeyHold);
    }
  }

  public handleActions(actions: DesktopInputHandlerActions): void {
    this.actions = actions;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.actions[event.code as keyof typeof this.actions]?.(event);

    if (this.shouldFireKeyHoldPerFrame) {
      this.heldKeys.add(event.code);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (this.shouldFireKeyHoldPerFrame) {
      this.heldKeys.delete(event.code);
    }
  }

  private handleKeyHold(): void {
    this.heldKeys.forEach((key) => {
      this.actions[key as keyof typeof this.actions]?.({
        type: "keydown",
        code: key,
      } as KeyboardEvent);
    });

    this.animationFrameRequest = requestAnimationFrame(this.handleKeyHold); // Continue the loop
  }

  private handleMouseEvents(event: MouseEvent): void {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints;
    if (isTouch) return;

    let actionKey: DesktopActionKeys | undefined;

    switch (event.type) {
      case "mousedown":
        if (event.button === 0) {
          const now = Date.now();

          if (now - this.lastClickTime < this.doubleClickDuration) {
            actionKey = "doubleClick";
            this.lastClickTime = 0;
            clearTimeout(this.longClickTimeout);
          } else {
            this.lastClickTime = now;
            this.longClickTimeout = window.setTimeout(() => {
              if (now === this.lastClickTime) {
                actionKey = "longClick";
                this.actions[actionKey]?.(event);
              }
            }, this.longClickDuration);
          }
        } else if (event.button === 1) {
          actionKey = "middleClick";
        } else if (event.button === 2) {
          actionKey = "rightClick";
        }
        break;

      case "mouseup":
        if (event.button === 0) {
          clearTimeout(this.longClickTimeout);
          if (
            Date.now() - this.lastClickTime < this.longClickDuration &&
            actionKey !== "doubleClick"
          ) {
            actionKey = "click";
          }
        }
        break;
    }

    if (actionKey) {
      this.actions[actionKey]?.(event);
    }
  }

  private handleScroll(event: WheelEvent): void {
    let actionKey: DesktopActionKeys | undefined;

    const scrollTop =
      this.element instanceof Document
        ? document.documentElement.scrollTop
        : this.element.scrollTop;
    const scrollLeft =
      this.element instanceof Document
        ? document.documentElement.scrollLeft
        : this.element.scrollLeft;

    if (scrollTop > this.lastScrollTop) {
      actionKey = "scrollDown";
    } else if (scrollTop < this.lastScrollTop) {
      actionKey = "scrollUp";
    }

    if (scrollLeft > this.lastScrollLeft) {
      actionKey = "scrollRight";
    } else if (scrollLeft < this.lastScrollLeft) {
      actionKey = "scrollLeft";
    }

    this.lastScrollTop = scrollTop;
    this.lastScrollLeft = scrollLeft;

    if (actionKey) {
      this.actions[actionKey]?.(event);
    }
  }

  public destroy() {
    clearTimeout(this.longClickTimeout);

    if (this.animationFrameRequest) {
      cancelAnimationFrame(this.animationFrameRequest);
    }

    // @ts-ignore
    this.element.removeEventListener("keydown", this.handleKeyDown);
    // @ts-ignore
    this.element.removeEventListener("keyup", this.handleKeyUp);
    // @ts-ignore
    this.element.removeEventListener("mousedown", this.handleMouseEvents);
    // @ts-ignore
    this.element.removeEventListener("mouseup", this.handleMouseEvents);
    // @ts-ignore
    this.element.removeEventListener("scroll", this.handleScroll);
  }
}
