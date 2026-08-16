import { BaseComponent } from "@pages/baseComponent";
import { Login } from "@pages/login.page";
import { Products } from "@pages/products.page";

export class BasePage extends BaseComponent {
    login = new Login(this.page);
    products = new Products(this.page);
}