import React from 'react';

import GLBackground from '../components/GLBackground';

export default () => (
  <>
    <GLBackground>
      {`
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        precision mediump int;
        uniform vec2 u_resolution;
        uniform vec2 u_oreso;
        uniform vec2 u_mouse;
        uniform float u_time;
        const float PI = 3.14159265358979323;
        const float CAMERA_FOV = 25.;
        const float CAMERA_OFFSET = 16.;
        const float RAY_T_MIN = 0.0001;
        const float RAY_T_MAX = 1.0e30;
        const vec3 EMPTY_VEC3 = vec3(1, 1, 1);
        const int DEPTH = 1;
        const int SPHERES = 3;
        const float TIME_SCALE = 0.25;
        const float SPHERE_RADIUS = 6.;
        const float SPHERE_STEP = 0.25;
        const float SPHERE_RADIUS_GROWTH = 3.;
        const float SPHERE_SCALE_GROWTH = 1.0;
        const float SPHERE_DISP_GROWTH = 1.0;
        const float SPHERE_STEP_GROWTH = 0.25;
        const vec2 SPHERE_BNS = vec2(8, 8);
        const int LIGHTS = 1;
        const vec3 BRIGHTNESS = vec3(1, 1, 1);
        struct Material{
        vec3 specular;
        float shininess;
        bool reflective;
        float reflectN;
        bool refractive;
        float refractN;
        };
        const Material EMPTY_MATERIAL = Material(EMPTY_VEC3, 0., false, 0.0, false, 0.0);
        struct Ray{
        vec3 point;
        vec3 direction;
        float tMax;
        };
        struct Sphere{
        vec3 center;
        float radius;
        vec2 noiseScale;
        vec2 noiseDisp;
        float noiseStep;
        Material m;
        };
        struct Hit{
        bool hit;
        float tMax;
        vec3 point, normal;
        Material m;
        vec3 color;
        };
        struct Eye{
        vec3 point;
        vec3 forward;
        vec3 up;
        vec3 right;
        float h;
        float w;
        };
        struct Light{
        vec3 point, intensity;
        float attn;
        float ambient;
        };
        const Hit NO_HIT = Hit(false, RAY_T_MAX, EMPTY_VEC3, EMPTY_VEC3, EMPTY_MATERIAL, EMPTY_VEC3);
        vec3 refraction(vec3 I, vec3 N, float ior){

        float cosi = clamp(-1., 1., dot(I, N)); 
        float etai = 1., etat = ior; 
        vec3 n = N; 
        if (cosi < 0.) { 
          cosi = -cosi; 
        } else { 
          float tmp = etai;
          etai = etat;
          etat = tmp;
          n= -N; 
        } 
        float eta = etai / etat; 
        float k = 1. - eta * eta * (1. - cosi * cosi); 
        if(k < 0.){
          return EMPTY_VEC3;
        }

        return eta * I + (eta * cosi - sqrt(k)) * n; 
        }
        // Simplex 3D Noise 
        // by Ian McEwan, Ashima Arts
        //
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        float snoise(vec3 v){ 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;
        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        //  x0 = x0 - 0. + 0.0 * C 
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1. + 3.0 * C.xxx;
        // Permutations
        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( 
            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        // Gradients
        // ( N*N points uniformly over a square, mapped onto an octahedron.)
        float n_ = 1.0/7.0; // N=7
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        //Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                      dot(p2,x2), dot(p3,x3) ) );
        }
        float getNoise(Sphere s, vec3 phit){
        // check if it is in perlin noise
        vec3 diff = normalize(phit - s.center);
        float longi = diff.z;
        float lati = diff.x;
        longi = (longi + PI)*180./PI;
        lati = (lati + PI)*180./PI;
        longi /= 360.; 
        lati /= 360.;
        return step(snoise(vec3(vec2(longi, lati)*s.noiseScale + s.noiseDisp + vec2(u_time, u_time), u_time*TIME_SCALE) ), s.noiseStep);
        }
        Hit intersect(Ray r, Sphere s, float et){
        Ray local = Ray(r.point, r.direction, r.tMax);
        local.point -= s.center;
        // Calculate quadratic coefficients
        float dl = length(local.direction);
        float a = dl*dl;
        float b = 2. * dot(local.direction, local.point);
        float ol = length(local.point);
        float sr = s.radius;
        float c = ol*ol  - sr;
        float discriminant = b*b - 4. * a * c;
        if (discriminant < 0.0)
        {
          return NO_HIT;
        }
        // Find two points of intersection, t1 close and t2 far
        float t1 = (-b - sqrt(discriminant)) / (2. * a);
        float t2 = (-b + sqrt(discriminant)) / (2. * a);
        float t = -1.0;
        // First check if close intersection is valid
        if (t1 > RAY_T_MIN && t1 < et)
        {
          t = t1;
          
          
          vec3 phit = r.direction*t + r.point;
          float noise = getNoise(s, phit);
          if(noise > 0.){
            return Hit(true, t, phit, normalize(phit - s.center), s.m, s.m.specular);
          }
        }
        if (t2 > RAY_T_MIN && t2 < et)
        {
          t = t2;
          
          
          vec3 phit = r.direction*t + r.point;
          float noise = getNoise(s, phit);
          if(noise > 0.){
            return Hit(true, t, phit, normalize(phit - s.center), s.m, s.m.specular);
          }
        }
        if(t == -1.0){
          // Neither is valid
          return NO_HIT;
        }
        return NO_HIT;
        }
        Ray eyeMakeRay(Eye e, vec2 point){
        vec3 dir = e.forward + point.x * e.w * e.right + point.y * e.h * e.up;
        return Ray(e.point, normalize(dir), RAY_T_MAX);
        }
        Eye createEye(vec3 point, vec3 target, vec3 upguide, float fov, float aspectRatio){
        vec3 forward = normalize(target - point);
        vec3 right = normalize(cross(forward, upguide));
        vec3 up = cross(right, forward);
        float h = tan(fov);
        float w = h * aspectRatio;
        return Eye(point, forward, right, up, h, w);
        }
        vec3 ptColor(Hit h, Eye e, Light l, vec3 color){
        vec3 normal = h.normal;
        vec3 surfacePos = h.point;
        vec3 surfaceColor = color;
        Material m = h.m;
        vec3 surfaceToLight  = normalize(l.point - surfacePos);
        vec3 surfaceToEye = normalize(e.point - surfacePos);
        vec3 ambient = l.ambient * surfaceColor * l.intensity;
        float dC = max(0.0, dot(normal, surfaceToLight));
        vec3 diffuse = dC * surfaceColor * l.intensity;
        float sC = 0.0;
        if(dC > 0.0){
          float cosA = max(0.0, dot(surfaceToEye, reflect(-surfaceToLight, normal)));
          sC = pow(cosA, m.shininess);
        }
        vec3 specular = sC * m.specular * l.intensity;
        float dist = length(l.point - surfacePos);
        float attn = 1.0 / (1.0 + l.attn * dist*dist);
        vec3 linear = ambient + attn*(specular + diffuse);
        vec3 gamma = pow(linear, vec3(1./2.2, 1./2.2, 1./2.2));

        return gamma;
        }
        Sphere createSphere(float r, vec2 nsc, float nst, vec3 color){
        return Sphere(vec3(0), r, nsc, vec2(0), nst, Material(color, 1.0, false, 0.5, true, 1.52));
        }
        vec3 getIntersectionScene(Eye e, vec2 coord, Sphere[6] s, Light l[4]){
        float x = coord.x;
        float y = coord.y;
        float scx = 2.0*x / u_resolution.x - 1.0;
        float scy = -2.0*y / u_resolution.y + 1.0;
        float t = RAY_T_MAX;

        Ray ray = eyeMakeRay(e, vec2(scx, scy));
        vec3 final = vec3(1.);

        float ref = 1.0;
        for(int i = 0; i < DEPTH; i++){
          Hit closest;
          for(int j = 0; j < SPHERES; j++){
            Hit h = intersect(ray, s[j], t);
            if(h.hit){
              t = h.tMax;
              closest = h;
            }
          }
          if(RAY_T_MAX >= t){
            vec3 mixture = vec3(1);
            for(int j = 0; j < LIGHTS; j++){
              mixture *= ptColor(closest, e, l[j], closest.color);
            }
            final *= mixture * ref;
            if(closest.m.reflective){
              ray = Ray(closest.point, reflect(ray.direction, closest.normal), RAY_T_MAX);
              ref *= closest.m.reflectN;
            } else if(closest.m.refractive) {
              ray = Ray(closest.point, refraction(ray.direction, closest.normal, closest.m.refractN), RAY_T_MAX);
            }
            
          }
          t = RAY_T_MAX;
        }
        return final;
        }
        /**
         * for crt
         */
        vec3 scanline(vec2 coord, vec3 screen)
        {
        screen.xyz -= sin((coord.y + (u_time * 29.0))) * 0.02;
        return screen;
        }

        vec2 crt(vec2 coord, float bend)
        {
        // put in symmetrical coords
        coord = (coord - 0.5) * 2.0;
        coord *= 1.1;
        // deform coords
        coord.x *= 1.0 + pow((abs(coord.y) / bend), 2.0);
        coord.y *= 1.0 + pow((abs(coord.x) / bend), 2.0);
        // transform back to 0.0 - 1.0 space
        coord  = (coord / 2.0) + 0.5;
        return coord;
        }

        vec3 sampleSplit(Eye e, vec2 coord, Sphere[6] s, Light l[4])
        {
        vec3 frag;
        vec2 ratio = coord/u_resolution;
        //frag = getIntersectionScene(e, gl_FragCoord.xy, s, l);
        frag.x = getIntersectionScene(e, vec2(ratio.x - 0.0025 * sin(u_time), ratio.y)*u_resolution, s, l).x;
        frag.y = getIntersectionScene(e, coord, s, l).y;
        frag.z = getIntersectionScene(e, vec2(ratio.x + 0.0025 * sin(u_time), ratio.y)*u_resolution, s, l).z;
        return frag;
        }

        void main(){
        vec2 ms = u_mouse.xy;
        float width = u_oreso.x;
        float height = u_oreso.y;

        Material wood = Material(vec3(1, 1, 1), 0.5, true, 0.5, false, 1.0);
        Material glass = Material(vec3(1, 1, 1), 1., false, 0.5, true, 1.52);

        Sphere s[6];
        float radius = SPHERE_RADIUS;
        vec2 scale = SPHERE_BNS;
        float nstep = SPHERE_STEP;

        s[0] = createSphere(radius, scale, nstep, vec3(0.96, 0, 1));
        radius *= SPHERE_RADIUS_GROWTH;
        scale *= SPHERE_SCALE_GROWTH;
        nstep *= SPHERE_STEP_GROWTH;

        s[1] = createSphere(radius, scale, nstep, vec3(0.85, 0, 1));
        radius *= SPHERE_RADIUS_GROWTH;
        scale *= SPHERE_SCALE_GROWTH;
        nstep *= SPHERE_STEP_GROWTH;
        s[2] = createSphere(radius, scale, nstep, vec3(0.74, 0, 1));
        radius *= SPHERE_RADIUS_GROWTH;
        scale *= SPHERE_SCALE_GROWTH;
        nstep *= SPHERE_STEP_GROWTH;
        s[3] = createSphere(radius, scale, nstep, vec3(0.62, 0, 1));
        radius *= SPHERE_RADIUS_GROWTH;
        scale *= SPHERE_SCALE_GROWTH;
        nstep *= SPHERE_STEP_GROWTH;
        s[4] = createSphere(radius, scale, nstep, vec3(0.51, 0, 1));
        radius *= SPHERE_RADIUS_GROWTH;
        scale *= SPHERE_SCALE_GROWTH;
        nstep *= SPHERE_STEP_GROWTH;
        s[5] = createSphere(radius, scale, nstep, vec3(0.40, 0, 1));


        Light l[4];

        l[0] = Light(
          vec3(12, 0, 0),
          vec3(1),
          0.1,
          0.1
        );

        vec2 halfres = u_oreso.xy*0.5;

        ms = halfres - ms;
        ms /= halfres;

        ms *= PI;

        vec3 eye_pos = vec3(CAMERA_OFFSET + CAMERA_OFFSET*0.5*sin(ms.y*0.5), CAMERA_OFFSET, CAMERA_OFFSET*0.5*cos(ms.x*0.5));
        vec3 target = vec3(ms.y, 0.0, ms.x); // 
        vec3 upguide = vec3(0.0, 0.0, 1.0);
        float fov = CAMERA_FOV * PI/180.;
        float aspectRatio = width / height;
        Eye e = createEye(eye_pos, target, upguide, fov, aspectRatio);
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        uv.y = 1.0 - uv.y; // flip tex
        vec2 crtCoords = crt(uv, 3.2);
        // shadertoy has tiling textures. wouldn't be needed
        // if you set up your tex params properly
        if (crtCoords.x < 0.0 || crtCoords.x > 1.0 || crtCoords.y < 0.0 || crtCoords.y > 1.0){
          gl_FragColor = vec4(0.0);
        } else {
          // Split the color channels
          vec3 v = sampleSplit(e, gl_FragCoord.xy, s, l);
          // HACK: this bend produces a shitty moire pattern.
          // Up the bend for the scanline
          vec2 screenSpace = crtCoords * u_resolution.xy;
          //vec3 currentJulia = getJulia(gl_FragCoord.xy);
          gl_FragColor = vec4(scanline(screenSpace, v), 1.0);
        }
      }
    `}
    </GLBackground>
  </>
);
