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
      const shader = gl!.createShader(type);

      if (!shader) {
        throw new Error("Impossible de créer le shader.");
      }

      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);

      if (
        !gl!.getShaderParameter(
          shader,
          gl!.COMPILE_STATUS
        )
      ) {
        console.error(
          gl!.getShaderInfoLog(shader)
        );

        gl!.deleteShader(shader);

        return null;
      }

      return shader;
    }

    const vertexShader = createShader(
      gl!.VERTEX_SHADER,
      vertexShaderSource
    );

    const fragmentShader = createShader(
      gl!.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) {
      return;
    }

    const program =
      gl!.createProgram();

    if (!program) {
      return;
    }

    gl!.attachShader(
      program,
      vertexShader
    );

    gl!.attachShader(
      program,
      fragmentShader
    );

    gl!.linkProgram(program);

    if (
      !gl!.getProgramParameter(
        program,
        gl!.LINK_STATUS
      )
    ) {
      console.error(
        gl!.getProgramInfoLog(program)
      );

      return;
    }

    gl!.useProgram(program);

    const buffer =
      gl!.createBuffer();

    gl!.bindBuffer(
      gl!.ARRAY_BUFFER,
      buffer
    );

    gl!.bufferData(
      gl!.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
      ]),
      gl!.STATIC_DRAW
    );

    const positionLocation =
      gl!.getAttribLocation(
        program,
        "a_position"
      );

    gl!.enableVertexAttribArray(
      positionLocation
    );

    gl!.vertexAttribPointer(
      positionLocation,
      2,
      gl!.FLOAT,
      false,
      0,
      0
    );

    const timeLocation =
      gl!.getUniformLocation(
        program,
        "u_time"
      );

    const resolutionLocation =
      gl!.getUniformLocation(
        program,
        "u_resolution"
      );

    const mouseLocation =
      gl!.getUniformLocation(
        program,
        "u_mouse"
      );

    let mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    // Fonction utilitaire pour s'assurer que canvas n'est pas null
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

      const dpr =
        Math.min(
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

    // Appel initial pour définir les dimensions
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

      if (
        !rect.width ||
        !rect.height
      ) {
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

    let animationFrame: number = 0;

    function render(time: number) {
      const currentCanvas = getCanvas();
      
      // Mise à jour des dimensions si nécessaire
      resizeCanvas();

      gl!.viewport(
        0,
        0,
        currentCanvas.width,
        currentCanvas.height
      );

      if (timeLocation !== null) {
        gl!.uniform1f(
          timeLocation,
          time * 0.001
        );
      }

      if (resolutionLocation !== null) {
        gl!.uniform2f(
          resolutionLocation,
          currentCanvas.width,
          currentCanvas.height
        );
      }

      if (mouseLocation !== null) {
        gl!.uniform2f(
          mouseLocation,
          mouse.x,
          mouse.y
        );
      }

      gl!.drawArrays(
        gl!.TRIANGLE_STRIP,
        0,
        4
      );

      animationFrame =
        requestAnimationFrame(
          render
        );
    }

    animationFrame =
      requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      resizeObserver.disconnect();

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      // Nettoyage des ressources WebGL
      if (program) {
        gl!.deleteProgram(program);
      }
      if (vertexShader) {
        gl!.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl!.deleteShader(fragmentShader);
      }
      if (buffer) {
        gl!.deleteBuffer(buffer);
      }
    };
  }, []);

  return (
  <main className="relative h-screen w-full overflow-hidden bg-black text-white">

    {/* =========================================
        BACKGROUND SHADER
    ========================================= */}
    <div className="absolute inset-0 z-0 h-full w-full">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
      />
    </div>

    {/* =========================================
        MAIN CONTENT
    ========================================= */}
    <div className="relative z-10 flex h-screen w-full flex-col justify-between p-6 md:p-12">

      {/* TOP */}
      <div className="flex w-full flex-col items-center justify-center gap-3">
  <img
    src="/logo-blanc.svg"
    alt="The Labyrinth"
    className="
      h-24
      w-24
      object-contain
      opacity-90
      transition-opacity
      hover:opacity-100
      md:h-32
      md:w-32
    "
  />

  <p className="cursor-pointer transition-colors hover:text-white">
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
  
  

      {/* CENTER */}
      <div className="flex flex-1 items-center justify-center">

        <div
          className="
            mx-auto
            w-full
            max-w-4xl
            text-center
            [text-shadow:0_2px_10px_rgba(0,0,0,0.8),0_0_20px_rgba(0,0,0,1)]
          "
        >

          <div className="space-y-6">

            <div
              className="
                mb-8
                text-[10px]
                uppercase
                tracking-[0.4em]
                text-white
                opacity-50
                md:text-xs
              "
            >
              L'ÉQUIPE CORE
            </div>

            <div className="space-y-4">

              <p className="text-sm uppercase tracking-wider md:text-base">
                <span className="font-medium text-white">
                  Jonathan ZELI
                </span>

                <span className="mx-3 opacity-20">
                  //
                </span>

                <span className="text-zinc-400">
                  Commercial
                </span>
              </p>

              <p className="text-sm uppercase tracking-wider md:text-base">
                <span className="font-medium text-white">
                  Sylvère KOBA
                </span>

                <span className="mx-3 opacity-20">
                  //
                </span>

                <span className="text-zinc-400">
                  Ingénieur Réseau
                </span>
              </p>

              <p className="text-sm uppercase tracking-wider md:text-base">
                <span className="font-medium text-white">
                  Modeste KOUASSI
                </span>

                <span className="mx-3 opacity-20">
                  //
                </span>

                <span className="text-zinc-400">
                  Architecte - Programmeur
                </span>
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* BOTTOM */}
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
            mb-10
            space-y-2
            text-[10px]
            uppercase
            tracking-widest
            text-zinc-400
            opacity-90
            md:text-xs
          "
        >
          <p className="cursor-pointer transition-colors hover:text-white">
            <span className="
              bg-white/90
              px-1 py-1
              text-black
              inline-block
            ">
              contact@thelabyrinth.africa
            </span>
          </p>

          <span className="
            bg-white/90
            px-1 py-1
            text-black
            inline-block
          ">
            +225 01 01 01 4650
          </span>

          <p>
            Côte d'Ivoire, Abidjan - 2 Plateaux Vallon
          </p>
        </div>

        <div
          className="
            pb-2
            text-[9px]
            uppercase
            tracking-[0.3em]
            text-zinc-400
            opacity-40
            md:text-[10px]
            text-white
          "
        >
          @2026 Powered by The Labyrinth
        </div>

      </div>

    </div>

  </main>
);
}