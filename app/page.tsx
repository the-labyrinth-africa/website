"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

    if (!gl) {
      console.error("WebGL n'est pas supporté par ce navigateur.");
      return;
    }

    const vertexShaderSource = `
      attribute vec2 a_position;

      varying vec2 v_texCoord;

      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;

      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      varying vec2 v_texCoord;

      float random(vec2 st) {
        return fract(
          sin(dot(st.xy, vec2(12.9898, 78.233))) *
          43758.5453123
        );
      }

      float char(vec2 st, float n) {
        st = st * 2.0 - 1.0;
        st *= 1.2;

        if (n < 0.5) {
          float r = length(st);

          return smoothstep(0.7, 0.65, r) *
                 smoothstep(0.45, 0.5, r);
        } else {
          return step(-0.15, st.x) *
                 step(st.x, 0.15) *
                 step(-0.8, st.y) *
                 step(st.y, 0.8);
        }
      }

      void main() {
        vec2 st = v_texCoord;

        float rows = 35.0;

        float aspect =
          u_resolution.x / u_resolution.y;

        vec2 grid =
          vec2(rows * aspect, rows);

        vec2 ipos =
          floor(st * grid);

        vec2 fpos =
          fract(st * grid);

        float colRand =
          random(vec2(ipos.x, 0.0));

        float speed =
          0.4 + colRand * 0.8;

        float t =
          u_time * speed;

        float yOffset =
          random(vec2(ipos.x, 456.789)) * 20.0;

        float rowIdx =
          floor(
            ipos.y +
            t * 12.0 +
            yOffset
          );

        float b =
          step(
            0.5,
            random(vec2(ipos.x, rowIdx))
          );

        float c =
          char(fpos, b);

        float trail =
          fract(
            ipos.y / grid.y +
            t * 0.15 +
            yOffset * 0.1
          );

        trail =
          pow(trail, 3.0);

        float dim =
          0.08 +
          0.25 *
          random(vec2(ipos.x, rowIdx));

        vec3 color =
          vec3(0.4, 0.45, 0.4) *
          c *
          (trail + dim);

        float mDist =
          length(
            (u_mouse / u_resolution) - st
          );

        color +=
          vec3(0.15) *
          c *
          (
            1.0 -
            smoothstep(0.0, 0.35, mDist)
          );

        gl_FragColor =
          vec4(color, 1.0);
      }
    `;

    function createShader(
      type: number,
      source: string
    ) {
      const shader = gl?.createShader(type);

      if (!shader) {
        throw new Error("Impossible de créer le shader.");
      }

      gl?.shaderSource(shader, source);
      gl?.compileShader(shader);

      if (!gl?.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl?.getShaderInfoLog(shader));

        gl?.deleteShader(shader);

        return null;
      }

      return shader;
    }

    const vertexShader = createShader(
      gl.VERTEX_SHADER,
      vertexShaderSource
    );

    const fragmentShader = createShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) {
      return;
    }

    const program = gl.createProgram();

    if (!program) {
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation =
      gl.getAttribLocation(
        program,
        "a_position"
      );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    const timeLocation =
      gl.getUniformLocation(
        program,
        "u_time"
      );

    const resolutionLocation =
      gl.getUniformLocation(
        program,
        "u_resolution"
      );

    const mouseLocation =
      gl.getUniformLocation(
        program,
        "u_mouse"
      );

    let mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    const getCanvas = (): HTMLCanvasElement => {
      const currentCanvas = canvasRef.current;

      if (!currentCanvas) {
        throw new Error("Canvas est null");
      }

      return currentCanvas;
    };

    function resizeCanvas() {
      const currentCanvas = getCanvas();

      const width =
        currentCanvas.clientWidth ||
        window.innerWidth;

      const height =
        currentCanvas.clientHeight ||
        window.innerHeight;

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      const displayWidth =
        Math.floor(width * dpr);

      const displayHeight =
        Math.floor(height * dpr);

      if (
        currentCanvas.width !== displayWidth ||
        currentCanvas.height !== displayHeight
      ) {
        currentCanvas.width = displayWidth;
        currentCanvas.height = displayHeight;
      }
    }

    resizeCanvas();

    const resizeObserver =
      new ResizeObserver(() => {
        resizeCanvas();
      });

    resizeObserver.observe(canvas);

    function handleMouseMove(
      event: MouseEvent
    ) {
      const currentCanvas = getCanvas();

      const rect =
        currentCanvas.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        return;
      }

      const nx =
        (event.clientX - rect.left) /
        rect.width;

      const ny =
        1 -
        (event.clientY - rect.top) /
        rect.height;

      mouse.x =
        nx * currentCanvas.width;

      mouse.y =
        ny * currentCanvas.height;
    }

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    let animationFrame = 0;

    function render(time: number) {
      const currentCanvas = getCanvas();

      resizeCanvas();

      gl?.viewport(
        0,
        0,
        currentCanvas.width,
        currentCanvas.height
      );

      if (timeLocation !== null) {
        gl?.uniform1f(
          timeLocation,
          time * 0.001
        );
      }

      if (resolutionLocation !== null) {
        gl?.uniform2f(
          resolutionLocation,
          currentCanvas.width,
          currentCanvas.height
        );
      }

      if (mouseLocation !== null) {
        gl?.uniform2f(
          mouseLocation,
          mouse.x,
          mouse.y
        );
      }

      gl?.drawArrays(
        gl?.TRIANGLE_STRIP,
        0,
        4
      );

      animationFrame =
        requestAnimationFrame(render);
    }

    animationFrame =
      requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);

      resizeObserver.disconnect();

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      if (program) {
        gl.deleteProgram(program);
      }

      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }

      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }

      if (buffer) {
        gl.deleteBuffer(buffer);
      }
    };
  }, []);

  return (
    <main
      className="
        relative
        min-h-screen
        w-full
        overflow-x-hidden
        bg-black
        text-white
      "
    >

      {/* =========================================
          BACKGROUND SHADER
      ========================================= */}
      <div
        className="
          fixed
          inset-0
          z-0
          h-full
          w-full
        "
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
        />
      </div>


      {/* =========================================
          MAIN CONTENT
      ========================================= */}
      <div
        className="
          relative
          z-10
          flex
          min-h-screen
          w-full
          flex-col
          justify-between
          px-4
          py-5
          sm:px-6
          sm:py-6
          md:p-12
        "
      >

        {/* =========================================
            TOP
        ========================================= */}
        <div
          className="
            flex
            w-full
            flex-col
            items-center
            justify-center
            gap-2
            sm:gap-3
          "
        >

          <img
            src="/logo-blanc.svg"
            alt="The Labyrinth"
            className="
              h-20
              w-20
              object-contain
              opacity-90
              transition-opacity
              hover:opacity-100
              sm:h-24
              sm:w-24
              md:h-32
              md:w-32
            "
          />

          <p
            className="
              px-2
              text-center
              text-[10px]
              sm:text-xs
              md:text-sm
            "
          >
            <span
              className="
                inline-block
                bg-white/90
                px-1
                py-1
                text-black
              "
            >
              Ingénierie numérique, Conseil stratégique & IA appliquée.
            </span>
          </p>

        </div>


        {/* =========================================
    CENTER
========================================= */}
<div
  className="
    flex
    flex-1
    items-center
    justify-center
    px-2
    py-10
    sm:px-4
    sm:py-12
    md:py-0
  "
>
  <div
    className="
      mx-auto
      grid
      w-full
      max-w-7xl
      grid-cols-1
      gap-10
      text-center
      [text-shadow:0_2px_10px_rgba(0,0,0,0.8),0_0_20px_rgba(0,0,0,1)]
      sm:gap-12
      md:grid-cols-3
      md:gap-8
    "
  >

    {/* =====================================
        NOS PRODUITS
    ===================================== */}
    <div
      className="
        flex
        w-full
        flex-col
        items-center
        text-center
        md:items-start
        md:text-left
      "
    >
      <div
        className="
          mb-5
          text-[10px]
          uppercase
          tracking-[0.35em]
          text-[#EFBF04]
          opacity-90
          sm:mb-6
          sm:text-xs
          md:mb-8
          md:tracking-[0.4em]
        "
      >
        NOS PRODUITS
      </div>

      <div className="space-y-3 sm:space-y-4">
        <p className="text-xs uppercase tracking-wide sm:text-sm sm:tracking-wider md:text-base">
          <span className="font-medium text-white">
            Valorix
          </span>

          <span className="mx-2 opacity-20 sm:mx-3">
            //
          </span>

          <span className="text-zinc-400">
            Web
          </span>
        </p>

        <p className="text-xs uppercase tracking-wide sm:text-sm sm:tracking-wider md:text-base">
          <span className="font-medium text-white">
            Yua
          </span>

          <span className="mx-2 opacity-20 sm:mx-3">
            //
          </span>

          <span className="text-zinc-400">
            Mobile
          </span>
        </p>
      </div>
    </div>


    {/* =====================================
        EQUIPE CORE
    ===================================== */}
    <div
      className="
        flex
        w-full
        flex-col
        items-center
        justify-center
        text-center
      "
    >
      <div
        className="
          mb-5
          text-[10px]
          uppercase
          tracking-[0.35em]
          text-white
          opacity-90
          sm:mb-6
          sm:text-xs
          md:mb-8
          md:tracking-[0.4em]
        "
      >
        <u>L'ÉQUIPE CORE</u>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <p className="text-xs uppercase tracking-wide sm:text-sm sm:tracking-wider md:text-base">
          <span className="font-medium text-white">
            Jonathan ZELI
          </span>

          <span className="mx-2 opacity-20 sm:mx-3">
            //
          </span>

          <span className="text-zinc-400">
            Commercial
          </span>
        </p>

        <p className="text-xs uppercase tracking-wide sm:text-sm sm:tracking-wider md:text-base">
          <span className="font-medium text-white">
            Sylvère KOBA
          </span>

          <span className="mx-2 opacity-20 sm:mx-3">
            //
          </span>

          <span className="text-zinc-400">
            Ingénieur Réseau
          </span>
        </p>

        <p className="text-xs uppercase tracking-wide sm:text-sm sm:tracking-wider md:text-base">
          <span className="font-medium text-white">
            Modeste KOUASSI
          </span>

          <span className="mx-2 opacity-20 sm:mx-3">
            //
          </span>

          <span className="text-zinc-400">
            Architecte - Programmeur
          </span>
        </p>
      </div>
    </div>


    {/* =====================================
        NOS RÉALISATIONS
    ===================================== */}
    <div
      className="
        flex
        w-full
        flex-col
        items-center
        text-center
        md:items-end
        md:text-right
      "
    >
      <div
        className="
          mb-5
          text-[10px]
          uppercase
          tracking-[0.35em]
          text-[#EFBF04]
          opacity-90
          sm:mb-6
          sm:text-xs
          md:mb-8
          md:tracking-[0.4em]
        "
      >
        NOS RÉALISATIONS
      </div>

      <div className="space-y-3 sm:space-y-4">
        <p className="text-xs uppercase tracking-wide sm:text-sm sm:tracking-wider md:text-base">
          <span className="font-medium text-white">
            <a
              href="https://www.sparklinegroupe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#EFBF04]"
            >
              Sparkline Groupe
            </a>
          </span>

          <span className="mx-2 opacity-20 sm:mx-3">
            //
          </span>

          <span className="text-zinc-400">
            Site Web
          </span>
        </p>

        <p className="text-xs uppercase tracking-wide sm:text-sm sm:tracking-wider md:text-base">
          <span className="font-medium text-white">
            <a
              href="https://voixdefemme.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#EFBF04]"
            >
              Voix de Femme
            </a>
          </span>

          <span className="mx-2 opacity-20 sm:mx-3">
            //
          </span>

          <span className="text-zinc-400">
            Site Web
          </span>
        </p>
      </div>
    </div>

  </div>
</div>

        {/* =========================================
            BOTTOM
        ========================================= */}
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-4xl
            flex-col
            items-center
            text-center
            [text-shadow:0_2px_10px_rgba(0,0,0,0.8),0_0_20px_rgba(0,0,0,1)]
          "
        >

          <div
            className="
              mb-6
              space-y-2
              text-[9px]
              uppercase
              tracking-widest
              text-zinc-400
              opacity-90
              sm:mb-8
              sm:text-[10px]
              md:mb-10
              md:text-xs
            "
          >

            <p className="text-center">
              <span
                className="
                  inline-block
                  bg-white/90
                  px-1
                  py-1
                  text-black
                  transition-opacity
                  hover:opacity-100
                "
              >
                contact@thelabyrinth.africa
              </span>
            </p>

            <span
              className="
                inline-block
                bg-white/90
                px-1
                py-1
                text-center
                text-black
              "
            >
              +225 01 01 01 4650
            </span>

            <p className="px-2 text-center">
              Côte d'Ivoire, Abidjan - 2 Plateaux Vallon
            </p>

          </div>


          <div
            className="
              pb-2
              text-[8px]
              uppercase
              tracking-[0.25em]
              text-white
              opacity-80
              sm:text-[9px]
              md:text-[10px]
              md:tracking-[0.3em]
            "
          >
            @2026 Powered by{" "}
            <strong>The Labyrinth</strong>
          </div>

        </div>

      </div>
    </main>
  );
}