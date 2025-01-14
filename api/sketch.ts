import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
export default async (req, context) => {
  try {
    const options = {
      headless: true,
      defaultViewport: {
        width: 1200,
        height: 630,
      },
    };

    // Adjust based on the environment
    if (process.env.IS_LOCAL) {
      options.executablePath =
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    } else {
      options.executablePath = await chromium.executablePath();
      options.args = chromium.args;
    }

    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    const host = process.env.BASE_URL || process.env.URL;
    const scriptURL = `${host}/scripts/p5.min.js`;
    const response = await fetch(scriptURL);
    const p5Script = await response.text();

    const sketch = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }
          </style>
          <script>${p5Script}</script>
        </head>
        <body>
          <script>
            let tiles = [];
            let cols;
            let rows;
            let size;
            // let colors;
            let vexArc;
            let numShapes;
            let img;
            let colors = [];
            let numColors = 5;
            let baseColor;
            let complementaryColor;

            function preload() {
              // Load your image
              img = loadImage(
                "https://res.cloudinary.com/merkle-manufactory/image/fetch/c_fill,f_jpg,w_144/https%3A%2F%2Fi.imgur.com%2FcwUW3lt.jpg"
              );
            }

            class Tile {
              constructor(x, y, type, c) {
                this.x = x;
                this.y = y;
                this.type = type;
                this.c = c;
              }

              display() {
                push();
                translate(this.x, this.y);
                if (vexArc == 1) {
                  stroke(this.c);
                  noFill();
                  strokeWeight(5);
                  if (this.type == 0) {
                    arc(0, 0, size, size, 0, 90);
                    arc(size, size, size, size, 180, 270);
                    arc(size, size, size, size, 180, 270);
                  } else {
                    arc(size, 0, size, size, 90, 180);
                    arc(0, size, size, size, 270, 360);
                  }
                } else {
                  fill(this.c);
                  noStroke();
                  beginShape();
                  if (this.type == 0) {
                    // Shape 1
                    vertex(size, 0);
                    vertex(size, size);
                    vertex(0, size);
                  } else if (this.type == 1) {
                    // Shape 2
                    vertex(size, 0);
                    vertex(0, 0);
                    vertex(0, size);
                  } else if (this.type == 2) {
                    // Shape 3
                    vertex(size, size);
                    vertex(0, 0);
                    vertex(0, size);
                  } else {
                    // Shape 4
                    vertex(size, size);
                    vertex(0, 0);
                    vertex(size, 0);
                  }
                  endShape();
                }

                pop();
              }
            }

            function setup() {
              // randomSeed(1738);
              vexArc = floor(random(2));
              if (vexArc == 1) {
                numShapes = 2;
                angleMode(DEGREES);
              } else {
                numShapes = 4;
              }
              // print(vexArc, numShapes);

              size = floor(random(30, 60));
              createCanvas(1200, 630);
              // Get the colors from the image
              getColorsFromImage(img);
              baseColor = colors[floor(random(5))];
              complementaryColor = getComplementaryColor(baseColor);
              // colors = ["#0a1045", "#00c2d1", "#f9e900", "#f6af65", "#ed33b9"];

              cols = width / size;
              rows = height / size;
              for (let i = 0; i < cols; i++) {
                tiles[i] = [];
                for (let j = 0; j < rows; j++) {
                  tiles[i][j] = new Tile(
                    i * size,
                    j * size,
                    floor(random(numShapes)),
                    colors[floor(random(5))]
                  );
                }
              }
            }

            function draw() {
              background(complementaryColor);
              for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                  tiles[i][j].display();
                }
              }
              noLoop();
            }

            function getColorsFromImage(img) {
              img.loadPixels();
              colors = [];

              while (colors.length < numColors) {
                let x = int(random(img.width));
                let y = int(random(img.height));

                // Get the color at the random position
                let index = (y * img.width + x) * 4;
                let r = img.pixels[index];
                let g = img.pixels[index + 1];
                let b = img.pixels[index + 2];

                // Convert RGB to hex
                let colorHex = rgbToHex(r, g, b);

                // Check for duplicate color
                if (!colors.includes(colorHex)) {
                  colors.push(colorHex);
                  // print(colorHex);
                }
              }
            }

            function rgbToHex(r, g, b) {
              return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
            }

            function componentToHex(c) {
              let hex = c.toString(16);
              return hex.length == 1 ? "0" + hex : hex;
            }

            function getComplementaryColor(baseColor) {
              let r = red(baseColor);
              let g = green(baseColor);
              let b = blue(baseColor);

              // Calculate complementary color
              let compR = 255 - r;
              let compG = 255 - g;
              let compB = 255 - b;
              // Adjust brightness to make it darker (you can modify this factor)
              let darkerFactor = 0.47; // Adjust as needed
              compR *= darkerFactor;
              compG *= darkerFactor;
              compB *= darkerFactor;

              return color(compR, compG, compB);
            }

            window.onload = function() {
              new p5();
            };
          </script>
        </body>
      </html>
    `;

    await page.setContent(sketch);
    const renderDelay = 250; // in ms, how long you want to wait before capturing the screenshot
    await new Promise((resolve) => setTimeout(resolve, renderDelay)); // Wait a bit for the sketch to render

    const imageBuffer = await page.screenshot({ type: "png" });
    await browser.close();

    return new Response(imageBuffer, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  } catch (error) {
    console.error("Error generating sketch:", error);
    return new Response("Server Error: Cannot generate sketch", {
      status: 500,
    });
  }
};

export const config = {
  path: "/sketch",
};
