import  { test } from "@playwright/test";
import { BasePage } from "../../src";

test("User can log in and add product to the cart", async ({page}) => {
    const basePage = new BasePage(page);
    await basePage.login.openLoginPage();
    await basePage.login.doLogin("standard_user", "secret_sauce");
    await basePage.products.expectLoaded();
    await basePage.products.addProductToCart();
    await basePage.products.checkCartCount();
})

