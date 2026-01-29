# Curriculum Database Correction & Expansion Plan

I will update the `app/data/curriculumDatabase.ts` file to strictly align with the **People's Education Press (PEP/人教版)** standard, which is the most widely used curriculum in China (including Guangdong).

## 1. Corrections (Fixing Errors)
- **Math Grade 8 Vol 1 (上册):**
  - **Remove:** "Linear Function" (一次函数) - Moved to Vol 2.
  - **Remove:** "Real Numbers" (实数) - Usually Grade 7 Vol 2 in current PEP.
  - **Add:** "Integer Multiplication & Factorization" (整式的乘法与因式分解).
  - **Add:** "Fractions" (分式).
  - **Keep:** "Triangles" (三角形), "Congruent Triangles" (全等三角形), "Axis Symmetry" (轴对称).

- **Math Grade 8 Vol 2 (下册):**
  - **Add:** "Secondary Radicals" (二次根式).
  - **Add:** "Linear Functions" (一次函数).
  - **Add:** "Data Analysis" (数据的分析).
  - **Keep:** "Pythagorean Theorem" (勾股定理), "Parallelograms" (平行四边形).

- **Physics Grade 8 Vol 1 (上册):**
  - **Correction:** The current data lists "Pressure" and "Electricity". This is incorrect for PEP Grade 8 Vol 1.
  - **Update Content:**
    1.  Mechanical Motion (机械运动)
    2.  Acoustics (声现象)
    3.  State Changes (物态变化)
    4.  Optics (光现象)
    5.  Lenses (透镜及其应用)
    6.  Mass and Density (质量与密度)

- **Physics Grade 8 Vol 2 (下册) (New Entry):**
  - **Add:** Force (力), Motion and Force (运动和力), Pressure (压强), Buoyancy (浮力), Work and Energy (功和机械能), Simple Machines (简单机械).

- **History Grade 8 Vol 1 (上册):**
  - **Refine:** Ensure topics cover the Modern History timeline (Opium Wars to 1949).

## 2. Implementation
I will rewrite the `CURRICULUM_DATABASE` array in `app/data/curriculumDatabase.ts` with these corrected and expanded entries. I will maintain the existing ID structure (e.g., `guangdong-math-...`) to ensure compatibility with the rest of the app, but the content will be accurate to the PEP standard.
