import type { Page } from "@playwright/test";

export abstract class BaseComponent {
    constructor(protected page: Page) {

    }
}