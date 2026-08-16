import { env } from "@config/env";
import { expect } from "@playwright/test";
import { BaseComponent } from "./baseComponent";
import type { LoadableComponent } from "./loadableComponent";


export class Products extends BaseComponent implements LoadableComponent{
    async expectLoaded() {
        await expect(this.page.locator(".title"),
        "Products page isn't loaded")
        .toHaveText("Products");
    }
    async addProductToCart() {
        await this.page.getByTestId("add-to-cart-sauce-labs-backpack").click();
    }

    async checkCartCount() {
        await expect(this.page.locator(".shopping-cart-badge"),
    "Cart count isn't visible")
    .toHaveText("1");
    }

    async open() {
        await this.page.goto(env.baseUrl + "/inventory.html");
    }
}