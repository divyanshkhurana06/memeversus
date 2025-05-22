import { Request, Response, NextFunction } from 'express';

export declare function authenticateWallet(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void>;

export default authenticateWallet; 